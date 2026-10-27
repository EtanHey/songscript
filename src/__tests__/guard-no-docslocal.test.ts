import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const GUARD = resolve(process.cwd(), "scripts/guard-no-docslocal.sh");
const HOOK = resolve(process.cwd(), ".husky/pre-commit");

// Hooks export repository selectors; cwd alone does not isolate fixture Git.
const cleanGitEnv = () => Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
);

/** Build a throwaway git repo with the guard script copied in. */
function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "guard-docslocal-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: dir, env: cleanGitEnv(), stdio: "pipe" });

  git("init", "-q");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");

  mkdirSync(join(dir, "scripts"), { recursive: true });
  mkdirSync(join(dir, "docs.local"), { recursive: true });
  writeFileSync(
    join(dir, "scripts/guard-no-docslocal.sh"),
    readFileSync(GUARD),
  );
  writeFileSync(join(dir, ".gitignore"), "docs.local/\n");
  writeFileSync(join(dir, "README.md"), "test\n");
  git("add", "README.md", ".gitignore", "scripts/guard-no-docslocal.sh");
  git("commit", "-qm", "init");

  return dir;
}

function runGuard(dir: string, shell = "bash") {
  return spawnSync(shell, ["scripts/guard-no-docslocal.sh"], {
    cwd: dir,
    env: cleanGitEnv(),
    encoding: "utf8",
  });
}

describe("guard-no-docslocal.sh", () => {
  let dir: string;

  beforeAll(() => {
    dir = makeRepo();
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("preserves a linked-worktree sentinel despite inherited Git selectors", () => {
    const sentinel = mkdtempSync(join(tmpdir(), "guard-sentinel-"));
    const linked = join(sentinel, "linked");
    const env = cleanGitEnv();
    const git = (...args: string[]) => execFileSync("git", args, { cwd: sentinel, env });
    let fixture: string | undefined;
    let failure: unknown;
    try {
      git("init", "-q");
      git("-c", "user.name=sentinel", "-c", "user.email=sentinel@example.com", "commit", "--allow-empty", "-qm", "sentinel");
      git("worktree", "add", "-q", "--detach", linked);
      writeFileSync(join(linked, "docs.local"), "sentinel\n");
      git("-C", linked, "add", "docs.local");
      const gitDir = join(sentinel, ".git/worktrees/linked");
      const paths = [join(gitDir, "HEAD"), join(gitDir, "index"), join(sentinel, ".git/config")];
      const before = paths.map((path) => readFileSync(path));
      const config = () => git("config", "--local", "--get-regexp", "^(core\\.bare|user\\.)").toString();
      const beforeConfig = config();
      vi.stubEnv("GIT_DIR", gitDir);
      vi.stubEnv("GIT_INDEX_FILE", join(gitDir, "index"));
      try { fixture = makeRepo(); } catch (error) { failure = error; }
      expect(paths.map((path) => readFileSync(path))).toEqual(before);
      expect(config()).toBe(beforeConfig);
      expect(failure).toBeUndefined();
      expect(runGuard(fixture ?? linked).status).toBe(0);
    } finally {
      vi.unstubAllEnvs();
      if (fixture) rmSync(fixture, { recursive: true, force: true });
      rmSync(sentinel, { recursive: true, force: true });
    }
  });

  it("exits 0 when no docs.local path is tracked", () => {
    // docs.local exists on disk and is gitignored, but nothing is tracked.
    writeFileSync(join(dir, "docs.local/scratch.md"), "local only\n");

    const res = runGuard(dir);

    expect(res.status).toBe(0);
    expect(res.stdout).toContain("0 tracked paths");
  });

  it("exits 1 when a docs.local path is force-added past .gitignore", () => {
    // `git add -f` is exactly how .gitignore gets defeated in practice.
    writeFileSync(join(dir, "docs.local/leaked.md"), "sensitive\n");
    execFileSync("git", ["add", "-f", "docs.local/leaked.md"], { cwd: dir, env: cleanGitEnv() });

    const res = runGuard(dir);

    expect(res.status).toBe(1);
    expect(res.stdout).toContain("docs.local/leaked.md");
  });

  it("returns to exit 0 once the path is untracked, leaving the file on disk", () => {
    execFileSync("git", ["rm", "-q", "--cached", "docs.local/leaked.md"], {
      cwd: dir,
      env: cleanGitEnv(),
    });

    const res = runGuard(dir);

    expect(res.status).toBe(0);
    // The whole point: untracking must not delete the user's local file.
    expect(readFileSync(join(dir, "docs.local/leaked.md"), "utf8")).toBe(
      "sensitive\n",
    );
  });

  it("is invoked with bash, not sh, by the pre-commit hook", () => {
    // Regression test: the guard uses `set -o pipefail`, which dash rejects.
    // On Ubuntu/Debian /bin/sh is dash, so `sh scripts/guard-no-docslocal.sh`
    // aborted with "Illegal option -o pipefail" and rejected EVERY commit.
    const hook = readFileSync(HOOK, "utf8");

    expect(hook).toMatch(/bash scripts\/guard-no-docslocal\.sh/);
    expect(hook).not.toMatch(/(^|[^a-z])sh scripts\/guard-no-docslocal\.sh/m);
  });
});
