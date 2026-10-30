import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "test-results/**", "playwright-report/**", "src/lib/database.types.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // The admin console lives outside the language layout on purpose, so links into it are full page loads.
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
];

export default config;
