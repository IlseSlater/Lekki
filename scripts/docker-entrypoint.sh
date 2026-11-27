#!/usr/bin/env bash
set -euo pipefail

echo "[lekki] prisma migrate deploy…"
pnpm exec prisma migrate deploy

WEB_DIST="${WEB_DIST:-/app/apps/web/dist/web}"
if [[ -f "${WEB_DIST}/browser/index.html" ]]; then
  WEB_DIST="${WEB_DIST}/browser"
elif [[ -f "${WEB_DIST}/index.html" ]]; then
  :
elif [[ -f /app/apps/web/dist/web/browser/index.html ]]; then
  WEB_DIST="/app/apps/web/dist/web/browser"
fi

INDEX="${WEB_DIST}/index.html"
API_ORIGIN="${PUBLIC_API_ORIGIN:-}"
WEB_ORIGIN="${PUBLIC_WEB_ORIGIN:-${PUBLIC_API_ORIGIN:-}}"

if [[ -f "$INDEX" && -n "$API_ORIGIN" ]]; then
  echo "[lekki] injecting __LEOS_CONFIG__ into index.html"
  INDEX="$INDEX" API_ORIGIN="$API_ORIGIN" WEB_ORIGIN="$WEB_ORIGIN" node <<'NODE'
const fs = require('fs');
const p = process.env.INDEX;
let html = fs.readFileSync(p, 'utf8');
const cfg =
  '<script>window.__LEOS_CONFIG__=' +
  JSON.stringify({
    apiOrigin: process.env.API_ORIGIN,
    webOrigin: process.env.WEB_ORIGIN,
  }) +
  ';</script>';
if (!html.includes('__LEOS_CONFIG__')) {
  html = html.replace('</head>', cfg + '</head>');
  fs.writeFileSync(p, html);
}
NODE
fi

export SERVE_WEB_DIST="$WEB_DIST"
export PUBLIC_API_ORIGIN="${API_ORIGIN}"
export PUBLIC_WEB_ORIGIN="${WEB_ORIGIN}"

echo "[lekki] starting runtime (tsx) on :${RUNTIME_PORT:-3000}"
exec pnpm exec tsx apps/runtime/src/main.ts
