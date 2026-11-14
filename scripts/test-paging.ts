/**
 * Checks the pagination helper that keeps lists from silently stopping at row 1000.
 *
 *   npm run test:paging
 *
 * The fake query below behaves like a PostgREST builder: it honours `range(from, to)` and never
 * returns more than one page. No database is involved.
 */
import { fetchAllRows, fetchAllValues, ROWS_PER_REQUEST } from "../src/lib/data/paging";

let passed = 0;
let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ✔ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✖ ${name}${detail ? `  → ${detail}` : ""}`);
  }
}

/** A fake table of `total` rows; every call records the range it was asked for. */
function fakeTable(total: number, options: { failOnPage?: number } = {}) {
  const calls: [number, number][] = [];
  const build = () => {
    const state = { from: 0, to: 0 };
    const query = {
      range(from: number, to: number) {
        state.from = from;
        state.to = to;
        calls.push([from, to]);
        if (options.failOnPage !== undefined && calls.length === options.failOnPage) {
          return Promise.resolve({ data: null, error: { message: "boom" } });
        }
        const size = Math.max(0, Math.min(to - from + 1, total - from));
        const rows = Array.from({ length: Math.min(size, ROWS_PER_REQUEST) }, (_, i) => ({ id: from + i }));
        return Promise.resolve({ data: rows, error: null });
      },
    };
    return query;
  };
  return { build, calls };
}

async function main() {
  console.log("\nPagination");

  const empty = fakeTable(0);
  check("an empty table gives no rows", (await fetchAllRows(empty.build)).length === 0);

  const small = fakeTable(37);
  const smallRows = await fetchAllRows(small.build);
  check("a short list is read in one request", smallRows.length === 37 && small.calls.length === 1);

  const exact = fakeTable(ROWS_PER_REQUEST);
  const exactRows = await fetchAllRows(exact.build);
  check(
    "a list of exactly one page is read completely, with one confirming request",
    exactRows.length === ROWS_PER_REQUEST && exact.calls.length === 2,
    `${exactRows.length} rows in ${exact.calls.length} calls`
  );

  const large = fakeTable(2500);
  const largeRows = await fetchAllRows(large.build);
  check("2500 rows come back whole", largeRows.length === 2500, `${largeRows.length} rows`);
  check("the pages are contiguous", large.calls.every(([from], i) => from === i * ROWS_PER_REQUEST));
  check("no row is duplicated", new Set(largeRows.map((r) => r.id)).size === 2500);

  const failing = fakeTable(2500, { failOnPage: 2 });
  let message = "";
  try {
    await fetchAllRows(failing.build);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  check("a failed page is an error, never a short list", message === "boom", message);

  const values = await fetchAllValues((fakeTable(1500)).build, "id");
  check("only the requested column is returned", values.length === 1500 && values[0] === 0 && values[1499] === 1499);

  console.log(`\n${failed === 0 ? `All pagination checks passed (${passed})` : `${passed}/${passed + failed} checks passed — FAILURES above`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
