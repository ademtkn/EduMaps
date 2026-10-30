/** Mirrors public.looks_like_spam() so users get a friendly message before the database rejects the write. */
const URL_PATTERN = /(https?:\/\/|www\.)/gi;
const REPEATED_CHAR = /(.)\1{11,}/u;
const BLOCKED_TERMS =
  /(casino|viagra|porn|xxx|1xbet|bet365|crypto giveaway|казино|быстрый заработок|заработок без вложений|займ без отказа)/i;

export type SpamReason = "links" | "repeated" | "blocked_term";

export function detectSpam(text: string): SpamReason | null {
  if ((text.match(URL_PATTERN) ?? []).length > 2) return "links";
  if (REPEATED_CHAR.test(text)) return "repeated";
  if (BLOCKED_TERMS.test(text)) return "blocked_term";
  return null;
}
