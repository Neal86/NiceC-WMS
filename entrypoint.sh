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

  if [ "${RUN_DB_PUSH:-false}" = "true" ]; then
    echo "RUN_DB_PUSH=true; applying Prisma schema with db push."
    npx prisma db push
  else
    echo "RUN_DB_PUSH is not true; skipping automatic schema push for production safety."
  fi

  if [ "${RUN_DB_SEED:-false}" = "true" ]; then
    echo "RUN_DB_SEED=true; seeding default records."
    npx prisma db seed
  else
    echo "RUN_DB_SEED is not true; skipping seed."
  fi
else
  echo "DATABASE_URL is not set; app will use JSON fallback/mock mode where supported."
fi

echo "=== Launching NiceC WMS server ==="
exec node dist/server.cjs
