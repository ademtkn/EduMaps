#!/usr/bin/env bash
# One-command local setup: Supabase stack, migrations, environment file and demo data.
#   npm run setup
set -euo pipefail
cd "$(dirname "$0")/.."

need() { command -v "$1" >/dev/null 2>&1 || { echo "✖ '$1' is required but not installed." >&2; exit 1; }; }
need node; need npm; need docker
docker info >/dev/null 2>&1 || { echo "✖ Docker is not running. Start Docker Desktop and retry." >&2; exit 1; }

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[ "$NODE_MAJOR" -ge 20 ] || { echo "✖ Node 20.9+ required (found $(node -v))." >&2; exit 1; }

echo "• Installing dependencies"
npm install --no-audit --no-fund

echo "• Starting local Supabase (first run downloads Docker images)"
npx supabase start >/dev/null

echo "• Applying migrations from scratch"
npx supabase db reset --local >/dev/null

echo "• Writing .env.local"
STATUS=$(npx supabase status -o env 2>/dev/null)
get() { echo "$STATUS" | grep "^$1=" | head -1 | cut -d= -f2- | tr -d '"'; }
API_URL=$(get API_URL); ANON=$(get ANON_KEY); SERVICE=$(get SERVICE_ROLE_KEY)
EXISTING_TOKEN=""
if [ -f .env.local ]; then EXISTING_TOKEN=$(grep '^NEXT_PUBLIC_MAPBOX_TOKEN=' .env.local | cut -d= -f2- || true); fi
cat > .env.local <<ENV
NEXT_PUBLIC_SITE_URL=http://localhost:3100
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE}
NEXT_PUBLIC_MAPBOX_TOKEN=${EXISTING_TOKEN}
SEED_ADMIN_EMAIL=admin@edumap.kg
SEED_ADMIN_PASSWORD=EduMap-Admin-2026!
SEED_USER_PASSWORD=EduMap-Parent-2026!
NOTIFY_EMAIL_TO=team@edumaps.local
MAIL_FROM="EduMaps.kg <noreply@edumaps.local>"
SMTP_HOST=127.0.0.1
SMTP_PORT=56325
ENV

echo "• Generating TypeScript types"
npx supabase gen types typescript --local > src/lib/database.types.ts.tmp && mv src/lib/database.types.ts.tmp src/lib/database.types.ts

echo "• Seeding demo data"
npx tsx scripts/seed.ts

echo
echo "✔ Ready. Start the site with:  npm run dev   → http://localhost:3100"
[ -z "$EXISTING_TOKEN" ] && echo "  Tip: add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to enable the interactive map."
exit 0
