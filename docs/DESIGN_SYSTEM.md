# Design system

Positioning: premium, professional, modern, trustworthy, educational, clean, minimal, fast. A calm mix of Niche / GreatSchools information density, Google Maps utility and Medium readability. No flashy colours, no casino-style ads.

Tokens live in `src/app/globals.css` (`@theme`) and are the only source of colour, type and radius.

## Colour

| Token | Use |
|---|---|
| `brand-50…950` (Deep Blue, primary `brand-700 #1f4180`) | Primary actions, links, navigation, hero |
| `leaf-50…900` (Educational Green, `leaf-600 #1f7450`) | Secondary actions, positive states, ratings, accents |
| `ink-50…900` | Neutral grays: text, borders, surfaces |
| `success` · `warning` · `danger` · `info` | Status colours (alerts, badges, toasts) |

## Typography

Inter (latin, cyrillic, cyrillic-ext so Kyrgyz ң ө ү render in the same face). Scale: `text-display` 48 · `text-h1` 36 · `text-h2` 28 · `text-h3` 20 · `text-body` 16 · `text-small` 14 · `text-caption` 12, each with line-height and tracking. `cn()` is configured so tailwind-merge understands these tokens.

## Components (`src/components/ui` and feature folders)

Button (primary, secondary, outline, soft, ghost, danger, link; sm/md/lg/icon) · Input / Textarea / Select / Field / Honeypot · Badge · Card · Alert · Skeleton · Stars + RatingInput · Pagination · Breadcrumbs · EmptyState · Dialog (modal, bottom sheet on mobile) · Dropdown · Tabs · Accordion · Toast · Reveal (motion) · SectionHeading / PageHeader.
Feature components: SchoolCard, ArticleCard, PostCard, ReviewCard, AdCard (banner / sidebar / featured), SchoolFilters, SearchBar, SchoolGallery, MapExplorer, CompareTray + comparison table, SiteHeader / SiteFooter, JsonLd.

## Principles

Mobile-first (single column → 2/3 columns, filters in a bottom sheet, map/list toggle) · visible focus rings, skip link, ARIA states, `prefers-reduced-motion` respected · 16 px minimum control text on mobile · images lazy-loaded with `sizes` · ads always carry the dark "Advertisement" label.
