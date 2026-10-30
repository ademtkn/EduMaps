/** Minimal, dependency-free CSV reader and writer. Handles quotes, line breaks inside cells, BOM and comma / semicolon / tab separators. */

export type ParsedCsv = { rows: string[][]; delimiter: string };

const DELIMITERS = [",", ";", "\t"] as const;

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let best: string = ",";
  let bestCount = 0;
  for (const d of DELIMITERS) {
    let count = 0;
    let quoted = false;
    for (const ch of firstLine) {
      if (ch === '"') quoted = !quoted;
      else if (ch === d && !quoted) count += 1;
    }
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/** Spreadsheet exports protect cells that start with = + - @ with a leading apostrophe; take it off again. */
const unprotect = (cell: string) => (/^'[=+\-@]/.test(cell) ? cell.slice(1) : cell);

export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^﻿/, "");
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(unprotect(cell));
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(unprotect(cell));
      cell = "";
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(unprotect(cell));
    rows.push(row);
  }
  return { rows: rows.filter((r) => r.some((c) => c.trim() !== "")), delimiter };
}

/** Cells that a spreadsheet would run as a formula get a leading apostrophe. */
function protect(cell: string) {
  return /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
}

export function toCsv(rows: string[][], delimiter = ","): string {
  const quote = (cell: string) => {
    const safe = protect(cell);
    return /["\r\n]/.test(safe) || safe.includes(delimiter) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return `﻿${rows.map((r) => r.map(quote).join(delimiter)).join("\r\n")}\r\n`;
}
