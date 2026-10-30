/**
 * The company behind EduMaps.kg. Public pages show only its name and city (plus the contact details below);
 * the company's registry details (tax number, registration number, street address) are deliberately not shown anywhere on the site
 * and are not kept in this repository either (see private/registry.json, which is not committed).
 */
export const COMPANY = {
  brand: "Line.kg",
  website: "https://www.line.kg",
  websiteLabel: "www.line.kg",
  legalName: { en: "Line LLC", ru: "Line LLC", kg: "Line LLC" },
  location: { en: "Bishkek, Kyrgyzstan", ru: "Бишкек, Кыргызстан", kg: "Бишкек, Кыргызстан" },
  email: "linekginfo@gmail.com",
  phone: "+996 502 00 19 03",
  phoneHref: "tel:+996502001903",
  whatsappHref: "https://wa.me/996502001903",
  /** Official EduMaps.kg profiles (Instagram, YouTube, Telegram...). Listed as `sameAs` in structured data once filled in. */
  social: [] as string[],
} as const;

/** Bump when the Terms of Use or Privacy Policy change in a way users must accept again. */
export const LEGAL_VERSION = "2026-10-25";
export const MIN_AGE = 16;
