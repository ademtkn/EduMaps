/**
 * Replaces {name} placeholders: fmt("Hello {name}", { name: "Aida" }).
 * A template may hold "singular|plural" forms; the form is chosen from the numeric {count} value.
 */
export function fmt(template: string, vars: Record<string, string | number>): string {
  let text = template;
  if (text.includes("|")) {
    const [one = "", other = one] = text.split("|");
    const count = Number(String(vars.count ?? "").replace(/\s/g, ""));
    text = count === 1 ? one : other;
  }
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
