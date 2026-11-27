# Azure small deploy — `rg-lekki-pilot`

Start small on Azure free / credit. **Postgres B1ms is paid** (~lowest Azure Postgres SKU). Container Apps consumption + Blob stay near free at pilot volume.

## Topology

| Piece | SKU | Notes |
|-------|-----|--------|
| Resource group | `rg-lekki-pilot` | One group for everything |
| Container Apps | Consumption 0.25 vCPU / 0.5Gi | Nest + Angular in one image (WebSockets OK) |
| Azure Database for PostgreSQL | Flexible Server **Burstable B1ms** | Stop when idle; not free |
| Storage account + Blob | Standard LRS | Container `lekki-assets`, public read for images |
| ACR | Basic | Or build from local and push |

**Do not use App Service Free F1** — WebSockets/Socket.IO are unreliable there.

## Monthly floor (honesty)

- Postgres B1ms: expect roughly low tens of USD/month if left on; stop the server overnight to cut cost.
- Container Apps + Blob at pilot traffic: usually covered by free grant / credit.
- Custom domain HTTPS comes from Container Apps managed cert (free).

## One-shot script

See [deploy.md](deploy.md) for `az` commands.

Required app env (Container App secrets/env):

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
RUNTIME_PORT=3000
PUBLIC_API_ORIGIN=https://<your-app>.azurecontainerapps.io
PUBLIC_WEB_ORIGIN=https://<your-app>.azurecontainerapps.io
ASSET_STORE=azure-blob
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=lekki-assets
PUBLIC_ASSET_BASE_URL=https://<storage>.blob.core.windows.net/lekki-assets
STAFF_TOKEN_SECRET=...
LEKKI_VAULT_KEY=...
PILOT_POS_WEBHOOK_SECRET=...   # only for pre-activate / shared until per-venue vault
WEB_ORIGIN=https://<your-app>.azurecontainerapps.io
```


Image entrypoint runs `prisma migrate deploy` then starts the runtime (serves API + SPA).

## First smoke

1. `GET https://…/health` → ok  
2. Open Studio on the same origin (HTTPS)  
3. Guest QR must call `https://…` (not `http://host:3000`)
