#!/usr/bin/env bash
# Back up the local EduMaps database (schema + data) into backups/, one file per run.
#
#   npm run db:backup
#
# The dump is taken from the running Supabase container with pg_dump, so nothing has to be installed
# locally. Restoring is described in docs/DEPLOYMENT.md ("Backups"). Storage objects are not part of
# the dump: they live in the Supabase storage volume and are listed separately below.
set -euo pipefail

CONTAINER="${EDUMAP_DB_CONTAINER:-supabase_db_edumap}"
DB_USER="${EDUMAP_DB_USER:-postgres}"
DB_NAME="${EDUMAP_DB_NAME:-postgres}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="backups"
OUT_FILE="${OUT_DIR}/edumaps-${STAMP}.sql.gz"

if ! docker ps --format '{{.Names}}' | grep -qx "${CONTAINER}"; then
  echo "The database container ${CONTAINER} is not running. Start it with: npm run db:start" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

# Public schema only: it holds every content table, plus the Supabase-managed auth rows the site
# depends on for accounts. Auth is included so a restore keeps logins working.
docker exec "${CONTAINER}" pg_dump --username="${DB_USER}" --dbname="${DB_NAME}" \
  --schema=public --no-owner --no-privileges | gzip > "${OUT_FILE}"

SIZE="$(du -h "${OUT_FILE}" | cut -f1)"
echo "Database backup written: ${OUT_FILE} (${SIZE})"

# A quick inventory makes it obvious whether a dump is complete before it is needed.
docker exec "${CONTAINER}" psql --username="${DB_USER}" --dbname="${DB_NAME}" -Atc \
  "select 'schools=' || count(*) from public.schools
   union all select 'media=' || count(*) from public.school_media
   union all select 'reviews=' || count(*) from public.reviews
   union all select 'users=' || count(*) from public.users" > "${OUT_DIR}/edumaps-${STAMP}.counts.txt"
echo "Row counts: ${OUT_DIR}/edumaps-${STAMP}.counts.txt"

echo "Keep these files outside the repository (they contain personal data)."
