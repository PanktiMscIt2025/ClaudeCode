#!/bin/sh
# Container entrypoint: apply database migrations, make sure the first faculty account exists, then serve.
# Calls the local binaries directly (not npx) so it also works as a non-root user without a writable home,
# as on Hugging Face Spaces.
set -e
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set. Add your PostgreSQL connection string (e.g. from Neon) as a secret/environment variable." >&2
  exit 1
fi
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx prisma/seed.ts
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
