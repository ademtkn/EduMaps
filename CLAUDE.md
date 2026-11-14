# EduMaps task handoff

Start with [docs/handoff/README.md](docs/handoff/README.md) and the generated [school checkpoint](docs/handoff/schools-status.md). They record completed work, validation, research gaps and exact resume commands. Do not discard existing uncommitted work.

## Current user intent

1. Finish the username/email and Google/Apple authentication work left by Claude. Implementation and local validation are complete; real external OAuth still needs the owner's provider credentials. Details: `docs/handoff/auth-backend.md`, `auth-tests.md`, and the current checkpoint in `README.md`.
2. Research and place 34 private institutions on the local site: Bishkek 15 (two agents), Tokmok 5, Issyk-Kul outside Karakol 3, Karakol 2, Naryn 2, Manas/Jalal-Abad 5, Talas 2. Research agents and source manifests are saved by city under `data/research/2026-11-schools/`.

The owner clarified that “SI” means **QSI** and explicitly approved keeping **Genius.kg Tokmok as a draft** until a Tokmok branch is verified. When choosing among branches or unnamed city institutions, prefer the option with the most complete verified information and real images, and continue without repeated clarification.

3. Import every institution from the owner's Google Sheet and complete existing schools from it. Done 10 Nov 2026: 864 new (360 published, 504 to-be-checked drafts), 32 existing completed (fill-empty-only), 18 new settlements. Then six region agents verified the 504 drafts (`verify/`). Result: 651 published, 238 drafts and 13 archived. Demo schools were archived, and an `institution_kind` field and filter were added (migration 24). Details and open items: `docs/handoff/registry-import.md`; data in `data/registry/2026-11-sheet/`; `npm run registry:import` (dry run by default).

## Resume safely

- The site uses port **3100**; local Supabase uses **56321** (API), **56322** (DB), **56323** (Studio), **56324** (mail viewer).
- `.env.local` is configured. Never print its secret values.
- Do **not** run setup, reset or seed to resume: those erase local data.
- The research importer defaults to validation only and refuses remote Supabase hosts. `--apply` writes only to the local site, retaining backups and per-school state.
- Run `node scripts/research-status.mjs` to refresh the handoff, then inspect the per-institution gaps. Imports can resume after interruption.
- Source URLs, access dates, downloaded images, conflicting facts and absent public fields are preserved. Do not invent contacts, programs, teaching languages, coordinates, logos or photographs. Some genuine photographic video covers are labelled explicitly.
- Do not run `next build` concurrently with `next dev`; both write `.next`.
- No commit, push or public deployment was requested.

## Latest verified result

34 selected records are imported:33 published and Genius Tokmok draft.28 institutions have a logo plus two images;87 sourced image assets are accessible. The missing public-source fields/media are enumerated in schools-status.md; no replacement imagery was invented. One superseded AIM Balykchy candidate is preserved separately as a draft. Final build and102 locale-page responses passed. Normal `npm start` remains running at http://localhost:3100; health check passed.
