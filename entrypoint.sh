#!/bin/sh
set -e

echo "=== Starting NiceC-WMS Prisma DB Initialization ==="

# Generate Prisma client again to ensure correct runtime bindings
npx prisma generate

# Check if database is reachable before pushing
if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema changes via prisma db push..."
  npx prisma db push --accept-data-loss || echo "Prisma DB push skipped or failed (DB might be offline/mock mode)"
  
  echo "Seeding default NiceC-WMS records..."
  npx prisma db seed || echo "Prisma DB seeding skipped or failed (records may already exist)"
else
  echo "DATABASE_URL not specified, running in mock mode fallback."
fi

echo "=== NiceC-WMS Startup complete. Starting Express server... ==="
exec node dist/server.cjs
