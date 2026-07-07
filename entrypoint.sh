#!/bin/sh
set -eu

echo "=== Starting NiceC WMS ==="
echo "NODE_ENV=${NODE_ENV:-production}"
echo "PORT=${PORT:-3000}"

if [ -z "${JWT_SECRET:-}" ] || [ "${JWT_SECRET:-}" = "change-this-secret-in-production" ] || [ "${JWT_SECRET:-}" = "replace-with-a-long-random-production-secret" ]; then
  if [ "${NODE_ENV:-production}" = "production" ]; then
    echo "ERROR: JWT_SECRET must be set to a strong production value."
    exit 1
  fi
fi

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Generating Prisma client..."
  npx prisma generate

  # Production: use prisma migrate deploy (safe, only applies pending migrations)
  # Dev/Demo: use db push (schema sync, acceptable for development)
  # Schema sync strategy:
  #   Production: try prisma migrate deploy first (safe), fall back to db push if no migrations exist
  #   Dev:        db push (fast schema sync, acceptable for development)
  if [ "${NODE_ENV:-production}" = "production" ]; then
    if [ "${RUN_DB_MIGRATE:-true}" = "true" ]; then
      if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
        echo "Production mode: running prisma migrate deploy..."
        npx prisma migrate deploy || {
          echo "migrate deploy failed; falling back to db push."
          npx prisma db push --accept-data-loss
        }
      else
        echo "No migration files found; using prisma db push to sync schema."
        npx prisma db push --accept-data-loss
      fi
    else
      echo "RUN_DB_MIGRATE is not true; skipping database schema sync."
    fi
  else
    echo "Dev mode: applying Prisma schema with db push."
    npx prisma db push
  fi

  if [ "${RUN_DB_SEED:-false}" = "true" ]; then
    echo "RUN_DB_SEED=true; seeding default records."
    npx prisma db seed
  else
    echo "RUN_DB_SEED is not true; skipping seed."
  fi
else
  echo "DATABASE_URL is not set; app will use JSON fallback/mock mode where supported."
  echo "This is acceptable for demo/dev but NOT for production."
fi

echo "=== Launching NiceC WMS server ==="
exec node dist/server.cjs
