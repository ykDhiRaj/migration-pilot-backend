# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (leverages Docker layer cache)
COPY package*.json yarn.lock* ./
RUN npm ci --ignore-scripts 2>/dev/null || yarn install --frozen-lockfile

# Copy source & compile
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Only production deps
COPY package*.json yarn.lock* ./
RUN npm ci --omit=dev --ignore-scripts 2>/dev/null || yarn install --production --frozen-lockfile

# Copy compiled output
COPY --from=builder /app/dist ./dist
# Migrations handled by the Liquibase container — not bundled into the app image

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 4000

CMD ["node", "dist/main.js"]
