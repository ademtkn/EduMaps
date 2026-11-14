# School research and import checkpoint

Updated: 2026-11-11 02:26:08 (Asia/Bishkek).

User target:34 institutions. Genius.kg Tokmok remains a draft by explicit user instruction; SI was confirmed to mean QSI.

| Batch | Requested | Researched | Publishable | In local DB | Logo + two images in DB |
|---|---:|---:|---:|---:|---:|
| bishkek-a | 7 | 7 | 7 | 7 | 7 |
| bishkek-b | 8 | 8 | 8 | 8 | 7 |
| tokmok | 5 | 5 | 4 | 5 | 1 |
| issyk-kul | 3 | 3 | 3 | 3 | 2 |
| karakol | 2 | 2 | 2 | 2 | 2 |
| naryn | 2 | 2 | 2 | 2 | 2 |
| jalal-abad | 5 | 5 | 5 | 5 | 5 |
| talas | 2 | 2 | 2 | 2 | 2 |

Selected records locally imported: 34/34. Preserved historical candidates: 1. Stored image assets: 87.

## Resume commands

```sh
node --import tsx scripts/import-researched-schools.ts             # validate only
node --import tsx scripts/import-researched-schools.ts --apply     # loopback Supabase only
node scripts/research-status.mjs                                  # refresh this checkpoint
```

Never run setup, reset or seed to resume. They erase local data. Import state is saved after every school/asset; original changed school rows are backed up in data/research/2026-11-schools/backups/. Source manifests and downloaded images are retained. Do not run next build and next dev at the same time.

## Per-institution gaps

### bishkek-a

- **Indigo Sapat Primary School** — ready to publish; DB:published; missing stored media:none.
- **Asylkech Girls’ School** — ready to publish; DB:published; missing stored media:none.
- **Indigo Prime Academy International High School** — ready to publish; DB:published; missing stored media:none.
  - languages: teaching languages not explicitly confirmed; do not infer English from Cambridge branding
- **Indigo British Kids Club** — ready to publish; DB:published; missing stored media:none.
  - languages: an English focus is confirmed, actual instruction language is not
- **Indigo Kids Djal Kindergarten** — ready to publish; DB:published; missing stored media:none.
  - languages: instruction languages not explicitly published
- **Indigo Academy West** — ready to publish; DB:published; missing stored media:none.
  - phone: not found on the verified school profile; kindergarten number removed
  - whatsapp: no explicitly identified school WhatsApp contact
  - email: no verified school mailbox
  - website: no school-specific website verified
  - languages: additional English study is confirmed, instruction languages not explicitly stated
- **Light Academy International School** — ready to publish; DB:published; missing stored media:none.

### bishkek-b

- **Oxford International School** — ready to publish; DB:published; missing stored media:none.
  - WhatsApp unconfirmed
  - Facebook unconfirmed
- **QSI International School of Bishkek** — ready to publish; DB:published; missing stored media:none.
- **Silk Road International School** — ready to publish; DB:published; missing stored media:none.
  - WhatsApp unconfirmed
  - Facebook not yet retrieved
  - exact current grade range
- **Intellect Pro School** — ready to publish; DB:published; missing stored media:none.
  - WhatsApp number unconfirmed
- **Kelechek MIT Private School** — ready to publish; DB:published; missing stored media:none.
- **Chudo-Chado Child Development Centre** — ready to publish; DB:published; missing stored media:none.
  - instruction languages unconfirmed
  - Instagram unconfirmed
  - live official website unavailable
- **Edison Private School** — ready to publish; DB:published; missing stored media:none.
  - precise coordinates
  - 2GIS firm link
  - email unconfirmed
  - official standalone website unconfirmed
  - Facebook unconfirmed
  - two independent still photographs unavailable; gallery candidates are authentic stills from official school videos
- **Happy Kids Private Kindergarten** — ready to publish; DB:published; missing stored media:logo, photo-1, photo-2.
  - current operating status needs direct confirmation
  - academic programs
  - instruction languages
  - WhatsApp
  - email
  - website
  - Instagram
  - Facebook
  - logo
  - two genuine school photos

### tokmok

- **Tokmok Umut Girls’ Lyceum** — ready to publish; DB:published; missing stored media:none.
  - School-specific WhatsApp, Instagram and Facebook not verified; network-wide accounts deliberately not substituted.
  - Specific curriculum/accreditation not stated in institution page.
- **Genius.kg Private School — Tokmok (unconfirmed)** — draft; DB:draft; missing stored media:logo, photo-1, photo-2.
  - All Tokmok branch information remains unconfirmed: address, contacts, 2GIS, programs, instruction languages, grades and media.
- **Raduga Detstva Kindergarten** — ready to publish; DB:published; missing stored media:logo, photo-1, photo-2.
  - Verified WhatsApp, email, official website, Instagram and Facebook not found.
  - Logo and two institution-specific photos not available in consulted ministry/directory/map pages.
  - Current teaching languages: old ministry record ID1095/period6 lists Russian groups, but the current period14 record has all student/group fields zero, so Russian is not claimed as current.
- **Aalam International Magnet School — Tokmok** — ready to publish; DB:published; missing stored media:photo-1, photo-2.
  - Current Tokmok campus phone, WhatsApp, email, website and social profile not located.
  - Instruction languages, detailed curriculum and grade range not verified for this campus.
  - Two attributable Tokmok-campus photographs remain unavailable; the verified Yandex business and gallery pages expose no institution-photo URLs.
- **Amir Private Kindergarten** — ready to publish; DB:published; missing stored media:logo, photo-1, photo-2.
  - Phone, WhatsApp, email, official website and public social profiles not verified.
  - Instruction languages and detailed educational program not verified.
  - Logo and two institution-specific photos not available in consulted sources.

### issyk-kul

- **Diplomat School** — ready to publish; DB:published; missing stored media:logo.
  - Logo, verified2GIS firm URL, school WhatsApp/email/website/Instagram/Facebook not yet found.
  - Instruction languages and exact grade range not explicitly confirmed.
- **Birinchi Mugalim Educational Complex** — ready to publish; DB:published; missing stored media:none.
  - Languages of instruction are not explicitly confirmed; English is a taught subject, so it is not automatically marked as an instruction language.
  - WhatsApp and Facebook are not confirmed in official public contacts.
- **Ziyash Bektenov Issyk-Kul Girls Lyceum** — ready to publish; DB:published; missing stored media:none.
  - Verified2GIS firm URL and WhatsApp number not found.

### karakol

- **Zirek Kut Bilim School, Karakol** — ready to publish; DB:published; missing stored media:none.
  - School email, standalone official website and Facebook page not verified.
  - Specific accredited curriculum not published.
  - 2GIS firm listing not retrieved; the supplied 2GIS link is a map view generated from the directory's Google Maps place pin.
- **Lomonosov Art & Tech School, Karakol** — ready to publish; DB:published; missing stored media:none.
  - WhatsApp and Facebook URLs not verified.
  - 2GIS firm listing not retrieved; supplied 2GIS map-view URL uses independently published school coordinates.

### naryn

- **Bilimkana Naryn School** — ready to publish; DB:published; missing stored media:none.
  - Explicit languages of instruction not found; teachers of language subjects do not prove teaching medium.
  - WhatsApp and exact2GIS firm listing not verified.
  - Coordinates withheld because Ministry school pin accompanies117 address while official network and2026 AUCA source agree on172.
- **Muratbek Subakojoev Boys’ High School** — ready to publish; DB:published; missing stored media:none.
  - Current explicit languages of instruction not verified; language subjects and social-post languages were not treated as instruction-medium evidence.
  - WhatsApp and Facebook not reliably verified.
  - Exact 2GIS firm listing not retrieved; supplied 2GIS link is a map view centered on the sourced Ministry campus pin.
  - Current full grade range not explicitly verified, so gradeFrom and gradeTo are null.

### jalal-abad

- **Bilimkana Jalal-Abad School** — ready to publish; DB:published; missing stored media:none.
  - Exact 2GIS firm URL and school coordinates not retrieved.
  - Instruction languages are not explicitly confirmed by current campus sources; language-study subjects are not treated as teaching languages.
  - Campus-specific WhatsApp and Facebook not verified.
- **Zuura Nurmatova Girls Lyceum** — ready to publish; DB:published; missing stored media:none.
  - Exact verified 2GIS firm URL and school coordinates not retrieved.
  - Current instruction languages not explicitly published by campus sources; subjects and four-language social posts are not treated as teaching-language proof.
  - Campus WhatsApp and Facebook not verified.
  - Current final grade range not explicitly verified; only entry after grade6 is sourced.
- **Kurmanbek Baatyr Boys Lyceum** — ready to publish; DB:published; missing stored media:none.
  - Exact verified 2GIS firm URL and school coordinates not retrieved.
  - Current instruction languages not explicitly published by campus sources; subjects and four-language social posts are not treated as teaching-language proof.
  - Campus WhatsApp and Facebook not verified.
  - Current detailed curriculum and grade range not explicitly published by consulted campus pages.
- **Shkola Gramoteev School Complex** — ready to publish; DB:published; missing stored media:none.
  - Confirmed 2GIS firm link not located.
  - Instruction languages not explicitly stated; intensive language-study subjects are not presented as teaching-language evidence.
  - Email, standalone official website and Facebook page not verified.
- **Everest Lyceum** — ready to publish; DB:published; missing stored media:none.
  - Confirmed 2GIS firm link not located.
  - WhatsApp, email, standalone official website and Facebook page not verified.
  - Upper grade boundary not explicitly verified.

### talas

- **Bilimkana-Talas School** — ready to publish; DB:published; missing stored media:none.
  - WhatsApp number not explicitly verified for this campus.
  - Exact current grade range and named curriculum accreditation not verified.
- **Meerim Girls Lyceum, Talas** — ready to publish; DB:published; missing stored media:none.
  - Instruction languages and current complete grade range not explicitly verified; not inferred from languages taught or the network.
  - WhatsApp and school-specific Facebook page not explicitly verified.

## Source evidence

Each batch JSON retains field-level source URLs, access dates, media source pages, localPath references, warnings and explicit missing fields. Generated2GIS coordinate views are distinguished from confirmed firm listings. Public Ministry evidence and request descriptions are under shared-ministry/. See each batch .md for its research trail.
