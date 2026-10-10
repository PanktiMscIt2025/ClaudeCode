#!/bin/sh
# Container entrypoint: apply database migrations, make sure the first faculty account exists, then serve.
set -e
mkdir -p "${STORAGE_DIR:-/data/storage}"
npx prisma migrate deploy
npx tsx prisma/seed.ts
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
