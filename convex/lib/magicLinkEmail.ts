/**
 * Magic-link sign-in email
 *
 * Email clients strip most CSS, so this template uses a table layout with
 * inline styles and bgcolor fallbacks. Colours follow the app: gray-950 page,
 * gray-900 card, emerald buttons, and the brand-gradient wordmark
 * (green → white → red), rendered as per-letter colours because
 * background-clip: text is not supported in email.
 */

export const MAGIC_LINK_SUBJECT = "Sign in to SongScript";

// Interpolated from .brand-gradient in src/styles.css (#22c55e → #ffffff → #ef4444)
const WORDMARK: ReadonlyArray<readonly [string, string]> = [
  ["S", "#22c55e"], ["o", "#53d282"], ["n", "#84dfa6"], ["g", "#b5ecc9"], ["S", "#e6f9ed"],
  ["c", "#fdeaea"], ["r", "#fac1c1"], ["i", "#f69797"], ["p", "#f36e6e"], ["t", "#ef4444"],
];

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// emerald-700: white text on the site's emerald-600 is 3.77:1, below WCAG AA.
const BUTTON = "#047857";
const BUTTON_HOVER = "#065f46";

// Keeps clients from pulling body copy into the inbox preview after the preheader.
const PREHEADER_PAD = "&#8199;&#847;".repeat(40);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Host + path only; the token stays in the href, not the visible text. */
function shortLink(url: string): string {
  const { host, pathname } = new URL(url);
  return `${host}${pathname}`;
}

function expiryLabel(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export function renderMagicLinkEmail({ url, expiresInSeconds }: { url: string; expiresInSeconds: number }) {
  const href = escapeHtml(url);
  const expiry = expiryLabel(expiresInSeconds);
  const expiryHtml = expiry.replace(" ", "&nbsp;");
  const wordmark = WORDMARK.map(([letter, color]) => `<span style="color:${color};">${letter}</span>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${MAGIC_LINK_SUBJECT}</title>
<style>
  :root { color-scheme: dark light; supported-color-schemes: dark light; }
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  a.ss-button { transition: background-color 150ms ease, transform 160ms ease-out; }
  a.ss-button:active { transform: scale(0.97); }
  a.ss-button:focus-visible { outline: 2px solid #34d399; outline-offset: 3px; }
  @media (hover: hover) and (pointer: fine) { a.ss-button:hover { background-color: ${BUTTON_HOVER} !important; } }
  @media (prefers-reduced-motion: reduce) { a.ss-button { transition: background-color 150ms ease; } a.ss-button:active { transform: none; } }
  @media (max-width: 620px) { .ss-pad { padding-left: 24px !important; padding-right: 24px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background-color:#030712;" bgcolor="#030712">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;color:#030712;">Your sign-in link works once and expires in ${expiry}.${PREHEADER_PAD}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#030712" style="background-color:#030712;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr>
          <td bgcolor="#111827" class="ss-pad" style="background-color:#111827;border:1px solid #1f2937;border-radius:16px;padding:40px 48px;font-family:${FONT};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 0 32px 0;font-size:30px;line-height:36px;font-weight:800;letter-spacing:-0.6px;">${wordmark}</td>
              </tr>
              <tr>
                <td style="padding:0 0 8px 0;font-size:20px;line-height:28px;font-weight:600;color:#ffffff;">Sign in to SongScript</td>
              </tr>
              <tr>
                <td style="padding:0 0 28px 0;font-size:15px;line-height:24px;color:#d1d5db;">This link works once and expires in ${expiryHtml}.</td>
              </tr>
              <tr>
                <td style="padding:0 0 32px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${BUTTON}" style="background-color:${BUTTON};border-radius:10px;mso-padding-alt:14px 32px;">
                        <a href="${href}" class="ss-button" target="_blank" style="display:inline-block;padding:14px 32px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background-color:${BUTTON};"><span style="color:#ffffff;text-decoration:none;">Sign in</span></a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 0 0 0;border-top:1px solid #1f2937;font-size:13px;line-height:20px;color:#9ca3af;">Button not working? Open <a href="${href}" target="_blank" style="color:#34d399;text-decoration:none;white-space:nowrap;">${escapeHtml(shortLink(url))}</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="ss-pad" style="padding:20px 48px 0 48px;font-family:${FONT};font-size:13px;line-height:20px;color:#9ca3af;">Didn't ask for this? You can ignore it; nothing changes without the link.</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    "Sign in to SongScript",
    "",
    `This link works once and expires in ${expiry}:`,
    url,
    "",
    "Didn't ask for this? You can ignore it; nothing changes without the link.",
  ].join("\n");

  return { subject: MAGIC_LINK_SUBJECT, html, text };
}
