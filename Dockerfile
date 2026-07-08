# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build
RUN npm prune --omit=dev && npm install --no-save prisma

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nicec \
  && mkdir -p /app && chown -R nicec:nodejs /app

COPY --from=builder --chown=nicec:nodejs /app/package*.json ./
COPY --from=builder --chown=nicec:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nicec:nodejs /app/dist ./dist
COPY --from=builder --chown=nicec:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nicec:nodejs /app/entrypoint.sh ./entrypoint.sh
COPY --from=builder --chown=nicec:nodejs /app/.env.example ./.env.example

RUN chmod +x ./entrypoint.sh

USER nicec
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
