# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies first (leverage Docker layers)
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Build Vite frontend and bundle Express server with esbuild
RUN npm run build

# Production Runner stage
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

# Copy built artifacts, node_modules (including prisma CLI/dependencies) and schema
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

# Set production variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
