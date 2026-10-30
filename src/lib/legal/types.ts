export type LegalSection = { id: string; title: string; paragraphs?: string[]; items?: string[]; after?: string[] };
export type LegalDoc = { sections: LegalSection[] };
export type LegalKind = "privacy" | "terms" | "guidelines";
