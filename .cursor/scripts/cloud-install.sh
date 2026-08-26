#!/usr/bin/env bash
# Durable, idempotent repository setup for the Lekki/LEOS Cloud Agent environment.
# Runs after the repository is checked out. Installs Docker (for the Postgres dev
# database), project dependencies, and builds the workspace packages.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "[cloud-install] Ensuring Docker + compose are installed..."
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2
fi

# This VM is itself containerised, so the default overlay2 storage driver cannot
# mount overlay-on-overlay. vfs is slower but works reliably in nested setups.
echo "[cloud-install] Configuring Docker to use the vfs storage driver..."
sudo mkdir -p /etc/docker
echo '{"storage-driver":"vfs"}' | sudo tee /etc/docker/daemon.json >/dev/null

echo "[cloud-install] Preparing .env..."
[ -f .env ] || cp .env.example .env

echo "[cloud-install] Installing pnpm dependencies..."
pnpm install --frozen-lockfile

# The repo previously tracked composite tsc .tsbuildinfo files while dist/ is
# gitignored. Removing any stale build-info forces tsc to emit fresh .d.ts output.
echo "[cloud-install] Clearing stale TypeScript build info..."
find . -name 'tsconfig.tsbuildinfo' -not -path '*/node_modules/*' -delete || true

echo "[cloud-install] Building workspace packages..."
pnpm run build:packages

echo "[cloud-install] Done."
