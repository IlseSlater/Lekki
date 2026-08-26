#!/usr/bin/env bash
# Per-boot runtime initialisation for the Lekki/LEOS Cloud Agent environment.
# Starts the Docker daemon (this VM has no systemd), brings up Postgres, then
# generates/pushes the Prisma schema and seeds demo data. Idempotent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "[cloud-start] Ensuring Docker daemon is running..."
if ! sudo docker info >/dev/null 2>&1; then
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do
    sudo docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi
# Let the ubuntu user talk to the daemon without sudo (matches `docker compose` in dev.mjs).
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

echo "[cloud-start] Starting Postgres..."
docker compose up -d postgres
for _ in $(seq 1 60); do
  docker compose exec -T postgres pg_isready -U lekki >/dev/null 2>&1 && break
  sleep 1
done

echo "[cloud-start] Applying Prisma schema + seeding demo data..."
pnpm run db:generate
pnpm run db:push
pnpm run db:seed || true

echo "[cloud-start] Ready. Runtime + web are started via the configured terminals."
