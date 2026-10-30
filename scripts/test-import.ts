/**
 * Unit checks for the school spreadsheet importer (no database needed).
 *   npm run test:import
 */
import { EMPTY_SCHOOL } from "../src/lib/admin-defaults";
import { optionalInt } from "../src/lib/validation/admin";
import { parseCsv, toCsv } from "../src/lib/import/csv";
import {
  assemble, changedFields, COLUMN_KEYS, daysToText, exampleRows, formToRecord, headerRow, normalizeHeader, overlay, parseBoolean, parseDays, parseDecimal,
  parseInteger, parseTime, readRow, readTable, recordToRow, type Lookups,
} from "../src/lib/import/schools";

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
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const lookups: Lookups = {
  cities: [{ key: "bishkek", id: "11111111-1111-4111-8111-111111111111", names: ["Bishkek", "Бишкек"] }, { key: "osh", id: "22222222-2222-4222-8222-222222222222", names: ["Osh", "Ош"] }],
  systems: [{ key: "national", names: ["National curriculum", "Национальная программа", "Улуттук программа"] }, { key: "cambridge", names: ["Cambridge"] }],
  languages: [{ key: "kg", names: ["Kyrgyz", "Кыргызча"] }, { key: "ru", names: ["Russian", "Русский"] }, { key: "en", names: ["English"] }],
  facilities: [{ key: "library", names: ["Library", "Библиотека"] }, { key: "gym", names: ["Gymnasium", "Спортивный зал"] }],
  feeItems: [{ key: "meals", names: ["Meals", "Питание"] }, { key: "uniform", names: ["School uniform"] }, { key: "transport", names: ["School transport"] }],
};
const defaults = { status: "draft", dataStatus: "unverified" } as const;

console.log("\nCSV reading and writing");
check("comma separated file", eq(parseCsv("a,b\n1,2").rows, [["a", "b"], ["1", "2"]]));
check("semicolon separated file (Russian-language Excel)", eq(parseCsv("a;b\r\n1;2\r\n").rows, [["a", "b"], ["1", "2"]]) && parseCsv("a;b\n1;2").delimiter === ";");
check("tab separated file", parseCsv("a\tb\n1\t2").delimiter === "\t");
check("quotes, doubled quotes and line breaks inside a cell", eq(parseCsv('a,b\n"x, ""y""","l1\nl2"').rows[1], ['x, "y"', "l1\nl2"]));
check("a byte order mark is ignored", eq(parseCsv("﻿name_en,city\nA,B").rows[0], ["name_en", "city"]));
check("empty lines are dropped", parseCsv("a,b\n\n1,2\n,\n").rows.length === 2);
check("a leading apostrophe added by spreadsheets is removed", eq(parseCsv("a\n'+996555123456").rows[1], ["+996555123456"]));
check("cells that a spreadsheet would run as formulas are protected on export", toCsv([["=1+1", "+996", "plain"]]).includes("'=1+1") && toCsv([["+996"]]).includes("'+996"));
check("writing then reading gives the same cells", eq(parseCsv(toCsv([["a", 'b "q"', "c;d"], ["x\ny", "-5", "z"]])).rows, [["a", 'b "q"', "c;d"], ["x\ny", "-5", "z"]]));

console.log("\nValues");
check("numbers with spaces or separators", parseInteger("15 000") === 15000 && parseInteger("15,000") === 15000 && parseInteger("15.000") === 15000 && parseInteger("15000") === 15000 && parseInteger("0") === 0);
check("not a number", parseInteger("abc") === null && parseInteger("12x") === null);
check("decimals with a comma", parseDecimal("42,8746") === 42.8746 && parseDecimal("74.5698") === 74.5698 && parseDecimal("x") === null);
check("times", parseTime("8:30") === "08:30" && parseTime("08.30") === "08:30" && parseTime("830") === "08:30" && parseTime("3:15 pm") === "15:15" && parseTime("25:00") === null && parseTime("abc") === null);
check("yes and no in three languages", parseBoolean("Yes") === true && parseBoolean("да") === true && parseBoolean("ооба") === true && parseBoolean("нет") === false && parseBoolean("0") === false && parseBoolean("maybe") === null);
check("working days: ranges", eq(parseDays("Mon-Fri"), [1, 2, 3, 4, 5]) && eq(parseDays("Mon–Sat"), [1, 2, 3, 4, 5, 6]) && eq(parseDays("1-5"), [1, 2, 3, 4, 5]) && eq(parseDays("Пн-Пт"), [1, 2, 3, 4, 5]));
check("working days: lists", eq(parseDays("Mon, Wed, Fri"), [1, 3, 5]) && eq(parseDays("вт; чт"), [2, 4]) && parseDays("Funday") === null);
check("working days written back", daysToText([1, 2, 3, 4, 5]) === "Mon-Fri" && daysToText([1, 3, 5]) === "Mon, Wed, Fri" && daysToText([1, 2, 3, 4, 5, 6]) === "Mon-Sat");
check("column names: aliases and spacing", normalizeHeader(" School Name ") === "name_en" && normalizeHeader("Tuition from") === "fee_min" && normalizeHeader("Whats App") === "whatsapp" && normalizeHeader("FEE-PERIOD") === "fee_period");

check("a blank number stays empty and is never turned into 0 (a blank fee must not become “Free”)", optionalInt(0, 1000).parse("") === null && optionalInt(0, 1000).parse(null) === null && optionalInt(0, 1000).parse("0") === 0 && optionalInt(0, 1000).parse(0) === 0);

console.log("\nOne row");
const good = readRow({
  name_en: "Test Lyceum", name_ru: "Тестовый лицей", city: "Бишкек", school_type: "Частная", education_systems: "national; Cambridge", languages: "Кыргызча; Русский; en",
  grade_from: "1", grade_to: "11", fee_min: "15 000", fee_max: "22000", fee_period: "month", opening_time: "8:30", closing_time: "15:30", working_days: "Mon-Fri",
  fee_items: "Питание:included; uniform:5000/one_time; transport:paid", facilities: "library; Спортивный зал", whatsapp: "0555 123 456", has_transportation: "yes",
  lat: "42,8746", lng: "74.5698", address_en: "1 Test Street", phone: "+996 312 000 111",
}, 2, lookups);
check("a good row has no errors", good.errors.length === 0, good.errors.join("; "));
check("slug is made from the English name", good.slug === "test-lyceum");
check("city, type, systems and languages are found by name in any language", good.partial.city_id === lookups.cities[0]!.id && good.partial.school_type === "private" && eq(good.partial.education_systems, ["national", "cambridge"]) && eq(good.partial.languages, [{ code: "kg", is_primary: true }, { code: "ru", is_primary: false }, { code: "en", is_primary: false }]));
check("fee items in the three forms", eq(good.partial.fee_items, [
  { item_key: "meals", included: true, extra_amount: "", extra_period: "" },
  { item_key: "uniform", included: false, extra_amount: 5000, extra_period: "one_time" },
  { item_key: "transport", included: false, extra_amount: "", extra_period: "" },
]));
check("WhatsApp is converted to the international format", good.partial.whatsapp === "+996555123456");
const created = assemble(good, null, defaults);
check("a new school validates and gets the default status", created.errors.length === 0 && created.payload?.status === "draft" && created.payload?.data_status === "unverified", created.errors.join("; "));
check("the monthly fee, hours and days reach the payload", created.payload?.fee_min === 15000 && created.payload?.opening_time === "08:30" && eq(created.payload?.working_days, [1, 2, 3, 4, 5]));

const bad = readRow({ name_en: "Bad", city: "Atlantis", school_type: "boarding", grade_from: "x", fee_period: "weekly", whatsapp: "123", working_days: "Funday", fee_items: "unknown:included; meals:abc", lat: "north" }, 5, lookups);
check("every wrong cell is reported by column name", ["city:", "school_type:", "grade_from:", "fee_period:", "whatsapp:", "working_days:", "fee_items:", "lat:"].every((c) => bad.errors.some((e) => e.startsWith(c))), bad.errors.join(" | "));
check("a new school without a name, city or type is refused", assemble(readRow({ phone: "1" }, 3, lookups), null, defaults).errors.length >= 3);
const noAddress = assemble(readRow({ name_en: "X", city: "osh", school_type: "public", lat: "42.8", lng: "74.6" }, 4, lookups), null, defaults);
check("coordinates without an address are refused", noAddress.errors.some((e) => e.startsWith("address_en")), noAddress.errors.join(" | "));
const addressOnly = assemble(readRow({ name_en: "Address Only", city: "osh", school_type: "public", address_en: "5 Example Street", address_ru: "ул. Пример, 5" }, 9, lookups), null, defaults);
check("a school can be listed with an address and no coordinates", addressOnly.errors.length === 0 && (addressOnly.payload?.location as { lat: unknown; address: { ru?: string } } | undefined)?.lat === "" && (addressOnly.payload?.location as { address: { ru?: string } }).address.ru === "ул. Пример, 5", addressOnly.errors.join("; "));
check("…and it is warned that it will not appear on the map", addressOnly.warnings.some((w) => w.includes("map")));
const onlyLat = assemble(readRow({ name_en: "Half", city: "osh", school_type: "public", address_en: "x", lat: "42.8" }, 10, lookups), null, defaults);
check("only one of latitude and longitude is refused", onlyLat.errors.some((e) => e.startsWith("lng")), onlyLat.errors.join(" | "));
check("the plan column accepts free and pro and refuses anything else", readRow({ name_en: "P", plan: "Pro" }, 11, lookups).partial.plan === "pro" && readRow({ name_en: "P", plan: "gold" }, 11, lookups).errors.some((e) => e.startsWith("plan:")));
const noMap = assemble(readRow({ name_en: "No Map", city: "osh", school_type: "public" }, 6, lookups), null, defaults);
check("a school without coordinates is allowed, with a warning", noMap.errors.length === 0 && noMap.warnings.some((w) => w.includes("map")));
check("a free school (fee 0) is allowed", assemble(readRow({ name_en: "Free", city: "osh", school_type: "public", fee_min: "0" }, 7, lookups), null, defaults).errors.length === 0);
const swapped = assemble(readRow({ name_en: "Range", city: "osh", school_type: "public", fee_min: "500", fee_max: "100" }, 8, lookups), null, defaults);
check("a maximum fee below the minimum is refused", swapped.errors.some((e) => e.startsWith("fee_max")), swapped.errors.join(" | "));

console.log("\nUpdating an existing school");
const saved = { ...structuredClone(EMPTY_SCHOOL), id: "99999999-9999-4999-8999-999999999999", slug: "saved-school", name: { en: "Saved School", ru: "Сохранённая школа" }, city_id: lookups.cities[0]!.id!, school_type: "private" as const,
  education_systems: ["national"], phone: "+996 312 111 111", fee_min: 10000, fee_max: 12000, status: "published" as const, data_status: "verified" as const,
  languages: [{ code: "ru", is_primary: true }], programs: [{ kind: "club" as const, name: { en: "Chess" }, description: {} }],
  location: { lat: 42.87, lng: 74.6, address: { en: "Old Street", ru: "Старая улица" }, district: "North" } };
const update = readRow({ slug: "saved-school", phone: "+996 312 222 222", address_en: "New Street", name_kg: "Сакталган мектеп" }, 2, lookups);
const merged = overlay(saved as never, update.partial);
const result = assemble(update, saved as never, defaults);
check("an update validates", result.errors.length === 0, result.errors.join("; "));
check("only the filled-in cells change", merged.phone === "+996 312 222 222" && merged.location?.address.en === "New Street" && merged.name.kg === "Сакталган мектеп");
check("everything else is kept: other languages, programs, status, fee, coordinates", merged.name.ru === "Сохранённая школа" && merged.location?.address.ru === "Старая улица" && merged.programs.length === 1 && merged.status === "published" && merged.data_status === "verified" && merged.fee_min === 10000 && merged.location?.lat === 42.87);
check("the list of changed fields is exact", eq(changedFields(saved as never, merged).sort(), ["location", "name", "phone"]), changedFields(saved as never, merged).join(","));
check("an update that repeats the saved values changes nothing", changedFields(saved as never, overlay(saved as never, readRow({ slug: "saved-school", phone: "+996 312 111 111", fee_min: "10000" }, 2, lookups).partial)).length === 0);
check("status and information status are not touched unless given", assemble(readRow({ slug: "saved-school", phone: "1" }, 2, lookups), saved as never, { status: "published", dataStatus: "demo" }).payload?.data_status === "verified");

console.log("\nFile and template");
check("the template has a column for everything and example rows of the right width", headerRow().length === COLUMN_KEYS.length && exampleRows().every((r) => r.length === COLUMN_KEYS.length));
const templateRows = parseCsv(toCsv([headerRow(), ...exampleRows()])).rows;
const table = readTable(templateRows);
check("the template reads back without unknown columns", !table.error && table.ignored.length === 0 && table.records.length === 2);
const exampleChecks = table.records.map((r) => assemble(readRow(r.cells, r.line, { ...lookups, cities: [...lookups.cities], facilities: [...lookups.facilities, { key: "canteen", names: ["Canteen"] }] }), null, defaults));
check("the two example rows are valid, so the template teaches by example", exampleChecks.every((c) => c.errors.length === 0), exampleChecks.flatMap((c) => c.errors).join(" | "));
check("a file without a header is refused", Boolean(readTable([["foo", "bar"], ["1", "2"]]).error));
check("too many rows are refused", Boolean(readTable([["name_en"], ...Array.from({ length: 301 }, () => ["x"])]).error));
check("unknown columns are listed", eq(readTable([["name_en", "color"], ["x", "red"]]).ignored, ["color"]));

console.log("\nExport and import round trip");
const full = overlay(saved as never, {
  fee_period: "year", fee_billing_months: 10, opening_time: "08:30", closing_time: "15:30", working_days: [1, 2, 3, 4, 5], whatsapp: "+996555123456",
  education_systems: ["national", "cambridge"], languages: [{ code: "kg", is_primary: true }, { code: "en", is_primary: false }], facilities: [{ facility_key: "library", note: {} }],
  fee_items: [{ item_key: "meals", included: true, extra_amount: "", extra_period: "" }, { item_key: "uniform", included: false, extra_amount: 5000, extra_period: "one_time" }],
  social: { instagram: "https://instagram.com/test" }, has_scholarships: true, grade_from: 1, grade_to: 11,
});
const exported = parseCsv(toCsv([headerRow(), recordToRow(formToRecord(full, lookups))])).rows;
const back = readTable(exported);
const reread = readRow(back.records[0]!.cells, 2, lookups);
check("an exported school reads back without errors", reread.errors.length === 0, reread.errors.join("; "));
const again = overlay(full, reread.partial);
check("importing an unedited export changes nothing", changedFields(full, again).length === 0, changedFields(full, again).join(","));

console.log(`\n${failed === 0 ? "All" : `${passed}/${passed + failed}`} importer checks ${failed === 0 ? `passed (${passed})` : "passed — FAILURES above"}\n`);
process.exit(failed === 0 ? 0 : 1);
