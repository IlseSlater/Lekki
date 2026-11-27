# Deploy Lekki to Azure (small)

Prereqs: Azure CLI logged in, Docker, an Azure subscription with credit/free grant.

```bash
az login
az account set --subscription "<subscription-id>"

LOC=southafricanorth   # or westeurope if SA North unavailable
RG=rg-lekki-pilot
ACR=lekkipilotacr$RANDOM   # globally unique, lowercase
ENV=lekki-pilot-env
APP=lekki-pilot
PG=lekki-pilot-pg
STORE=lekkipilot$RANDOM
```

## 1. Resource group

```bash
az group create -n "$RG" -l "$LOC"
```

## 2. Postgres Flexible B1ms (paid — stop when idle)

```bash
az postgres flexible-server create \
  -g "$RG" -n "$PG" -l "$LOC" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0-255.255.255.255 \
  --admin-user lekki --admin-password "<strong-password>"

az postgres flexible-server db create -g "$RG" -s "$PG" -d leos

# DATABASE_URL=
# postgresql://lekki:<password>@${PG}.postgres.database.azure.com:5432/leos?sslmode=require
```

Stop when not piloting:

```bash
az postgres flexible-server stop -g "$RG" -n "$PG"
```

## 3. Blob storage

```bash
az storage account create -g "$RG" -n "$STORE" -l "$LOC" --sku Standard_LRS --kind StorageV2
az storage container create --account-name "$STORE" -n lekki-assets --public-access blob
az storage account show-connection-string -g "$RG" -n "$STORE" -o tsv
```

## 4. ACR + image

```bash
az acr create -g "$RG" -n "$ACR" -l "$LOC" --sku Basic
az acr login -n "$ACR"

# From repo root:
docker build -t "$ACR.azurecr.io/lekki:pilot" .
docker push "$ACR.azurecr.io/lekki:pilot"
```

## 5. Container Apps

```bash
az provider register -n Microsoft.App --wait
az containerapp env create -g "$RG" -n "$ENV" -l "$LOC"

az containerapp create \
  -g "$RG" -n "$APP" \
  --environment "$ENV" \
  --image "$ACR.azurecr.io/lekki:pilot" \
  --registry-server "$ACR.azurecr.io" \
  --target-port 3000 \
  --ingress external \
  --cpu 0.25 --memory 0.5Gi \
  --min-replicas 0 --max-replicas 1 \
  --secrets \
    db-url="<DATABASE_URL>" \
    storage-cs="<AZURE_STORAGE_CONNECTION_STRING>" \
    staff-secret="<STAFF_TOKEN_SECRET>" \
    vault-key="<LEKKI_VAULT_KEY>" \
  --env-vars \
    NODE_ENV=production \
    RUNTIME_PORT=3000 \
    ASSET_STORE=azure-blob \
    AZURE_STORAGE_CONTAINER=lekki-assets \
    DATABASE_URL=secretref:db-url \
    AZURE_STORAGE_CONNECTION_STRING=secretref:storage-cs \
    STAFF_TOKEN_SECRET=secretref:staff-secret \
    LEKKI_VAULT_KEY=secretref:vault-key

FQDN=$(az containerapp show -g "$RG" -n "$APP" --query properties.configuration.ingress.fqdn -o tsv)

az containerapp update -g "$RG" -n "$APP" \
  --set-env-vars \
    PUBLIC_API_ORIGIN="https://$FQDN" \
    PUBLIC_WEB_ORIGIN="https://$FQDN" \
    PUBLIC_ASSET_BASE_URL="https://${STORE}.blob.core.windows.net/lekki-assets" \
    WEB_ORIGIN="https://$FQDN"

echo "App: https://$FQDN"
echo "Health: https://$FQDN/health"
```

## 6. Smoke

```bash
curl -sS "https://$FQDN/health"
# Open https://$FQDN/studio in a browser — confirm Network calls are HTTPS same-origin.
```
