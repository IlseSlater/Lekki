# Lekki — single Container App (API + static web). Start small on Azure.
# Runtime boots via tsx (workspace packages resolve from source via tsconfig paths).
# Build: docker build -t lekki .
# Run:   docker run --rm -p 3000:3000 -e DATABASE_URL=... -e PUBLIC_API_ORIGIN=https://... lekki

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/runtime/package.json apps/runtime/
COPY apps/web/package.json apps/web/
COPY packages packages
COPY packs packs
COPY connectors connectors
COPY prisma prisma
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# Angular web only — Nest runs from TypeScript via tsx in the runner.
RUN pnpm --filter @lekki/web build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV RUNTIME_PORT=3000
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate \
  && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x ./scripts/docker-entrypoint.sh \
  && pnpm exec prisma generate

EXPOSE 3000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
