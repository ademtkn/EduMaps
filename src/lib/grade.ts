/**
 * Niche-style letter grades derived from the 5-point review score.
 * Kyrgyz schools mark work on a 5-4-3-2 scale, so the numeric score is always shown next to the letter.
 */
const SCALE: [number, string][] = [
  [4.7, "A+"], [4.5, "A"], [4.3, "A-"], [4.0, "B+"], [3.7, "B"], [3.4, "B-"], [3.0, "C+"], [2.6, "C"], [2.2, "C-"],
];

export function letterGrade(score: number): string {
  return SCALE.find(([min]) => score >= min)?.[1] ?? "D";
}

export type GradeTone = "excellent" | "good" | "fair" | "poor";
export function gradeTone(letter: string): GradeTone {
  if (letter.startsWith("A")) return "excellent";
  if (letter.startsWith("B")) return "good";
  if (letter.startsWith("C")) return "fair";
  return "poor";
}
