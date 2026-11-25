# Azure Deployment Plan

> **Status:** Deployed

Generated: 2026-11-25 12:40 SAST

---

## 1. Project Overview

**Goal:** Host the public Lekki website at https://lekki.co.za from the GitHub repo `IlseSlater/Lekki`, on Azure, for the Microsoft account `islater88@outlook.com`. The domain is registered at GoDaddy.

**Path:** Modernize Existing

The site that belongs on that domain is the Angular app in `apps/web`. Home, privacy, and terms are prerendered. Every other route is the client app. This plan does not host the Nest runtime or Postgres. Guest, Studio, and payments keep calling an API, and that API is a later deploy.

---

## 2. Requirements

| Attribute | Value |
|-----------|-------|
| Classification | Production |
| Scale | Small |
| Budget | Cost-Optimized |
| **Subscription** | Azure subscription 1 (`6671ad27-d713-4460-adb6-66e2ee773e8a`), tenant Default Directory (`83b7fef4-fb21-4a3b-9290-9d3358f117d4`), account `islater88@outlook.com` |
| **Location** | `westus2` |

The site was created in `westus2` on 2026-11-25 13:25 SAST. `westeurope` refused the new Static Web App for this subscription. The Free plan is served from Azure's edge network. Static Web Apps is not offered in `southafricanorth`.

Live hostname: `https://kind-flower-021ea431e.3.azurestaticapps.net`

Azure DNS nameservers for `lekki.co.za`, to enter at GoDaddy:

- `ns1-07.azure-dns.com`
- `ns2-07.azure-dns.net`
- `ns3-07.azure-dns.org`
- `ns4-07.azure-dns.info`

---

## 3. Components Detected

| Component | Type | Technology | Path |
|-----------|------|------------|------|
| Public website | Frontend | Angular 19 static output (prerender + client routes) | `apps/web` |
| Runtime API | API | NestJS — out of scope for this deploy | `apps/runtime` |
| Database | Data | Postgres — out of scope for this deploy | `docker-compose.yml` |

Build output already used for the public site: `apps/web/dist/web/browser`.

---

## 4. Recipe Selection

**Selected:** AZCLI

**Rationale:** One static site, one DNS zone, no containers. Azure CLI can create the Free Static Web App, deploy the built folder, and create the DNS zone. `azd` is a poor fit for this pnpm monorepo because the web build is `pnpm --filter @lekki/web run build` from the repo root.

---

## 5. Architecture

**Stack:** Serverless

### Service Mapping

| Component | Azure Service | SKU |
|-----------|---------------|-----|
| Public website | Static Web Apps | Free |
| lekki.co.za DNS | Azure DNS zone | Standard (about $0.50 per zone per month) |

### Why Azure DNS

GoDaddy is the registrar. GoDaddy DNS cannot create the ALIAS record an apex domain needs for Static Web Apps. The zone is created in Azure. GoDaddy keeps the registration and its nameservers are changed to the four Azure nameservers. Azure then issues the managed certificate for `lekki.co.za` and `www.lekki.co.za`.

### Supporting Services

None. No Key Vault, no database, no managed identity. The public pages do not read secrets.

### Names

| Resource | Name |
|----------|------|
| Resource group | `rg-lekki-web` |
| Static Web App | `lekki-co-za` |
| DNS zone | `lekki.co.za` |

### Current DNS (before this deploy)

`lekki.co.za` answers `160.153.0.100` from GoDaddy nameservers `ns49.domaincontrol.com` and `ns50.domaincontrol.com`. That is GoDaddy parking, not the Lekki site.

---

## 6. Provisioning Limit Checklist

### Phase 1: Prepare Resource Inventory

| Resource Type | Number to Deploy | Total After Deployment | Limit/Quota | Notes |
|---------------|------------------|------------------------|-------------|-------|
| Microsoft.Web/staticSites | 1 | 1 | 10 Free | Counted in the subscription before create: 0. |
| Microsoft.Network/dnsZones | 1 | 1 | 250 | Counted in the subscription before create: 0. |

**Status:** Within limits. Before create, the subscription had 0 static web apps (limit 10 Free) and 0 DNS zones (limit 250). After create: 1 static web app and 1 DNS zone.

---

## 7. Execution Checklist

### Phase 1: Planning

- [x] Workspace analyzed — existing Angular static site, not a new app
- [x] Requirements captured
- [x] Recipe selected — AZCLI
- [x] Architecture mapped — Static Web Apps Free + Azure DNS
- [x] Sign-in confirmed as `islater88@outlook.com` on subscription Azure subscription 1
- [x] Live quota read — 0 static web apps and 0 DNS zones before create

### Phase 2: Execution

- [x] Resource group `rg-lekki-web`
- [x] Static Web App `lekki-co-za` (Free, `westus2`)
- [x] Build `pnpm --filter @lekki/web run build`
- [x] Deploy `apps/web/dist/web/browser`
- [x] DNS zone `lekki.co.za` with apex alias and `www` CNAME
- [x] Nameservers recorded
- [ ] Bind `lekki.co.za` and `www.lekki.co.za` after GoDaddy nameservers propagate

### Human step that cannot be done from this machine

GoDaddy → lekki.co.za → Nameservers → change to the four Azure nameservers above. Until that change, the site is live on `https://kind-flower-021ea431e.3.azurestaticapps.net`.

---

## 8. Validation Proof

2026-11-25 13:28 SAST. Production upload reported success. HTTP checks against `https://kind-flower-021ea431e.3.azurestaticapps.net`:

| Path | Status | Title |
|------|--------|-------|
| `/` | 200 | Lekki — Your venue deserves its own home |
| `/privacy` | 200 | Privacy — Lekki |
| `/terms` | 200 | Terms — Lekki |
| `/studio` | 200 | Lekki — LEOS hospitality platform (client shell) |
