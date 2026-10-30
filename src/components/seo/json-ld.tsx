const LINE_SEPARATORS = new RegExp("[\\u2028\\u2029]", "g");

/** Renders schema.org JSON-LD. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(LINE_SEPARATORS, "");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
