FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# npm on macOS drops linux-only optional deps from the lockfile (npm/cli#4828);
# when that lands in a commit, npm ci fails — fall back to a lock-updating install.
RUN npm ci --no-audit --no-fund || \
    (echo "lockfile out of sync — falling back to npm install" && npm install --no-audit --no-fund)

COPY . .

# Next.js may prerender pages that touch the DB at build time
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]
