# School data audit — 10 November 2026

Scope: all eight selected city manifests, import state and importer, handoff instructions, and read-only local database comparisons. This audit changed only this report. No database rows, school manifests or application code were changed by the auditor.

## Findings and disposition

1. **Fixed and rechecked: wrong-branch contacts survived the West correction.** The published `indigo-academy-west` row retained phone/WhatsApp `+996557123333`, central Indigo email and website after the corrected school manifest removed them. The importer previously used `newValue ?? oldValue`, preventing a null from retracting an erroneous contact. Root made the four requested contact fields authoritative and reimported Bishkek A. A fresh read-only database query confirms phone, WhatsApp, email and website are now NULL; the school remains published. The verified West Instagram, Moskovskaya191a address and school photographs remain in the manifest.
2. **Handoff checkpoint correction requested.** The top of `README.md` still described30 imported schools/64 images and pending Naryn/Bishkek work, although its later activity log and generated status had newer counts. Root is refreshing this top checkpoint. Historical activity entries can remain, but the opening checkpoint must describe the final selected34 records.
3. **Logo presentation correction requested.** The authentic Intellect logo is transparent white lettering, invisible on the existing white logo frames. Wide school logos were also cropped by square `object-cover` frames. Root is applying full-logo containment and Intellect contrast. This is a rendering issue, not evidence of a false school logo.

No additional high-confidence city/branch mismatch, placeholder contact, duplicated selected slug or photograph-as-logo substitution was found in this review. This is a source-consistency audit, not direct confirmation by each institution.

## Selected-record validation

- Importer dry-run passed:34 selected records,33 publishable; requested city totals are15/5/3/2/2/5/2. Genius.kg Tokmok is the sole selected draft, as explicitly requested. SI is represented by QSI.
- Every selected record has nonempty KG/RU/EN names and short descriptions. Editorial translations are disclosed. Unknown public facts remain empty with reasons.
- Current manifests contain29 logos and29 pairs of images;28 schools have both a logo and two images. Media remain incomplete for Happy Kids Bakaev, Genius Tokmok, Raduga Tokmok, AALAM Tokmok, Amir Tokmok and Diplomat Balykchy. Do not describe all34 profiles as fully populated.
- Instruction languages are sourced for15 of34 records; programs are present for32. The two explicit primary-language claims are Russian for Bilimkana Talas and Everest. The [official Talas page](https://talas.bilimkana.kg/) explicitly states Russian as its main instruction language. Everest's saved official post documents English specifically for grade1 mathematics, and its description preserves that scope.
-24 selected records have a2GIS link:8 firm links,1 building link and15 generated coordinate map views. The manifests distinguish map views from verified business cards. Missing firm links must not be reported as confirmed2GIS listings.
- All supplied local media paths existed inside the research directory. All87 selected optimized files matched their saved SHA-256 hashes and source URLs. Visual inspection of the original84 images found no duplicated school photos; the only identical image hash was the legitimate shared Bilimkana network logo for Naryn and Talas. Historical imagery, photographic video covers, shared network marks and the Naryn photo montage are disclosed in source notes/captions.
- The replacement Birinchi Mugalim manifest and its three newly downloaded images were inspected separately: logo, partner-story classroom photo and official school olympiad video still. Its subjects are not mislabelled as instruction languages. Generic polished homepage illustrations were excluded by the research agent.
- Oxford's IB/private-school status, instruction languages and school phone are corroborated by the [IB's own school directory](https://ibo.org/programmes/find-an-ib-school/ibaem/o/oxford-international-school/). The direct page returned403 to the audit fetch; its current search-indexed primary-source contents were available and matched the manifest.

## Import and preservation evidence

The initial read-only comparison covered all34 then-selected school rows:33 published/1 draft, with27 unrelated existing school rows retained. Apart from the corrected West contacts, requested contacts, grades and languages matched their source manifests. Raduga's unsupported old Russian claim was already absent in the database. Selected research profiles contained no remaining seed gallery illustrations; manually uploaded Asylkech media and its unrelated YouTube channel were retained.

The importer refuses non-loopback Supabase hosts, defaults to dry-run, keeps first-touch row/child backups, removes only identified seed illustration rows and managed stale program/language rows, and does not reset the local database. Requested contact nulls now retract outdated imported values; unrelated social channels remain preserved.

## Final replacement checkpoint

**Completed and independently rechecked:** `birinchi-mugalim-school-cholpon-ata` is published with a stored logo and two gallery images; `aalam-aim-school-balykchy` is draft. The old state entry records `supersededBy: birinchi-mugalim-school-cholpon-ata`. All three new optimized image hashes match import state. There are34 currently selected institutions,33 published and Genius Tokmok draft;35 historical import entries including the retired AIM candidate, and87 stored selected assets. Calculate final selected counts from the current manifests, not the raw number of historical state entries.

Refresh `schools-status.md` after that operation. The historical Umut image failure has a successfully stored replacement and is not an active missing-media failure.
