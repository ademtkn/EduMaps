/**
 * Input sanitisation for user generated text. All user content is rendered as plain text by React
 * (never as HTML), so this is defence in depth: it removes markup, control characters and
 * oversized whitespace before anything reaches the database.
 */
const TAG_PATTERN = /<[^>]*>?/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

export function sanitizeLine(input: string): string {
  return input.replace(CONTROL_CHARS, "").replace(TAG_PATTERN, "").replace(/\s+/g, " ").trim();
}

export function sanitizeMultiline(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(TAG_PATTERN, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Only http(s) URLs are accepted anywhere a URL is stored. */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
