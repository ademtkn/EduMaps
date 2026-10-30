/**
 * Turns whatever an administrator typed into the international format WhatsApp links need ("+996555123456").
 * Accepts "0555 123 456", "555123456", "996 555 123 456", "+996 (555) 12-34-56" and "00996…". Returns null when it is not a number.
 */
export function normalizeWhatsapp(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith("+")) {
    digits = digits.replace(/\D/g, "");
    if (digits.startsWith("996") && digits.length === 12) digits = `+${digits}`;
    else if (digits.startsWith("0") && digits.length === 10) digits = `+996${digits.slice(1)}`;
    else if (digits.length === 9) digits = `+996${digits}`;
    else return null;
  }
  return /^\+[1-9]\d{9,14}$/.test(digits) ? digits : null;
}

/** A chat with the school that already holds a greeting naming the page the visitor came from. */
export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
