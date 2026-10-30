import { describe, expect, it } from "vitest";
import * as oneTimeMigration from "../../convex/oneTimeMigration";
import * as seed from "../../convex/seed";
import * as testData from "../../convex/testData";
import * as migration from "../../convex/migration";
import * as wordProgress from "../../convex/wordProgress";
import * as users from "../../convex/users";
import * as words from "../../convex/words";
import * as transcription from "../../convex/transcription";
import * as songs from "../../convex/songs";
import * as lyrics from "../../convex/lyrics";

// Inspect real registrations without executing any maintenance or PII handler.
const modules: Array<{
  name: string;
  exports: Readonly<Record<string, unknown>>;
  publicNames: string[];
}> = [
  { name: "oneTimeMigration", exports: oneTimeMigration, publicNames: [] },
  { name: "seed", exports: seed, publicNames: [] },
  { name: "testData", exports: testData, publicNames: [] },
  { name: "migration", exports: migration, publicNames: ["migrateAnonymousData"] },
  { name: "users", exports: users, publicNames: ["checkEmailExists", "ensureAppUser"] },
  { name: "songs", exports: songs, publicNames: ["list", "getById"] },
  { name: "lyrics", exports: lyrics, publicNames: ["getBySong"] },
  { name: "words", exports: words, publicNames: ["getByLine", "getBySong"] },
  { name: "transcription", exports: transcription, publicNames: [] },
  {
    name: "wordProgress", exports: wordProgress,
    publicNames: [
      "getByUser", "getByUserWord", "getByUserPersian", "getByUserPersians",
      "getByUserWords", "incrementViewCount", "incrementPlayCount", "toggleLearned",
      "setLearned", "getVocabularyByLanguage", "getWordDetailsWithSongs",
      "getWordPracticeHistory",
    ],
  },
];

function registrations(exports: Readonly<Record<string, unknown>>) {
  return Object.entries(exports).filter(([, fn]) => typeof fn === "function" && (
    "isQuery" in fn || "isMutation" in fn || "isAction" in fn
  ));
}

const functions = modules.flatMap(({ name: module, exports, publicNames }) =>
  registrations(exports).map(([name, fn]) => ({
    name: `${module}.${name}`, fn, isPublic: publicNames.includes(name),
  })),
);

describe("maintenance API boundary", () => {
  it.each(modules)("$name exposes only its approved public API", ({ exports, publicNames }) => {
    const actual = registrations(exports)
      .filter(([, fn]) => typeof fn === "function" && "isPublic" in fn && fn.isPublic === true)
      .map(([name]) => name);
    expect(actual.sort()).toEqual([...publicNames].sort());
  });

  it.each(functions)(
    "$name has its approved client visibility",
    ({ fn, isPublic }) => {
      expect(fn).toHaveProperty(isPublic ? "isPublic" : "isInternal", true);
      expect(fn).not.toHaveProperty(isPublic ? "isInternal" : "isPublic", true);
    },
  );

  it("has no frontend references to internal functions", () => {
    const sources = import.meta.glob<string>("../**/*.{ts,tsx}", {
      eager: true,
      query: "?raw",
      import: "default",
    });
    const internalNames = new Set(functions.filter((fn) => !fn.isPublic).map((fn) => fn.name));
    const references = Object.entries(sources).flatMap(([file, source]) =>
      [...source.matchAll(/\bapi\.(\w+)\.(\w+)/g)]
        .filter((match) => internalNames.has(`${match[1]}.${match[2]}`))
        .map((match) => `${file}: ${match[0]}`),
    );
    expect(references).toEqual([]);
  });
});
