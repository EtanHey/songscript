// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MAGIC_LINK_SUBJECT, renderMagicLinkEmail } from "./magicLinkEmail";

const url = "https://songscript-eight.vercel.app/auth/verify?token=abc123DEF456ghi789";

function anchors(html: string) {
  return [...html.matchAll(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(([tag, href, inner]) => ({ tag, href, inner }));
}

describe("magic-link email template", () => {
  const email = renderMagicLinkEmail({ url, expiresInSeconds: 300 });

  it("uses the sign-in subject", () => {
    expect(email.subject).toBe("Sign in to SongScript");
    expect(MAGIC_LINK_SUBJECT).toBe(email.subject);
  });

  it("renders exactly one white, non-underlined button pointing at the verify URL", () => {
    const buttons = anchors(email.html).filter((a) => a.tag.includes('class="ss-button"'));
    expect(buttons).toHaveLength(1);
    expect(buttons[0].href).toBe(url);
    expect(buttons[0].tag).toContain("color:#ffffff");
    expect(buttons[0].tag).toContain("text-decoration:none");
    expect(buttons[0].inner).toContain("Sign in");
  });

  it("links only to the verify URL and shows a shortened fallback without the token", () => {
    const links = anchors(email.html);
    expect(links).toHaveLength(2);
    expect(links.every((a) => a.href === url)).toBe(true);
    const fallback = links.find((a) => !a.tag.includes("ss-button"))!;
    expect(fallback.inner).toBe("songscript-eight.vercel.app/auth/verify");
    expect(email.html.split("abc123DEF456ghi789")).toHaveLength(3); // the two hrefs only
  });

  it("is email-safe: table layout, 600px max width, dark-mode meta, no images or pixels", () => {
    expect(email.html).toContain('role="presentation"');
    expect(email.html).toContain("max-width:600px");
    expect(email.html).toContain('<meta name="color-scheme" content="dark light">');
    expect(email.html).toContain('<meta name="supported-color-schemes" content="dark light">');
    expect(email.html).not.toMatch(/<img|url\(|<script/i);
  });

  it("keeps every attribute value well-quoted", () => {
    // A double quote inside a value (e.g. a font name) would end the attribute early.
    expect(email.html).not.toMatch(/="[^"]*"[^\s>/]/);
  });

  it("states the real expiry in both parts", () => {
    expect(email.html).toContain("expires in 5&nbsp;minutes");
    expect(email.text).toContain("expires in 5 minutes");
    expect(renderMagicLinkEmail({ url, expiresInSeconds: 3600 }).text).toContain("expires in 1 hour");
  });

  it("has a plain-text part with the full link", () => {
    expect(email.text).toContain("Sign in to SongScript");
    expect(email.text.split("\n")).toContain(url);
    expect(email.text).not.toMatch(/<[a-z]/i);
  });

  it("escapes the URL inside HTML attributes", () => {
    const html = renderMagicLinkEmail({ url: `${url}&x="><b>`, expiresInSeconds: 300 }).html;
    expect(html).not.toContain('"><b>');
    expect(html).toContain("&amp;x=&quot;&gt;&lt;b&gt;");
  });
});
