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

COPY package*.json ./
# Install production dependencies only (exclude devDependencies)
RUN npm ci --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Set production variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
