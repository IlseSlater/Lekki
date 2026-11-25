# Azure Deployment Plan

> **Status:** Planning

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
| **Subscription** | None. Signed in as `islater88@outlook.com` on 2026-11-25 12:45 SAST. Tenant `Default Directory` (`83b7fef4-fb21-4a3b-9290-9d3358f117d4`) has no subscription. A subscription has to be created before any resource can exist. |
| **Location** | `westeurope` |

`westeurope` is the Static Web Apps region closest to South Africa. The Free SKU is served from Azure's edge network, so the management region is not the visitor's download region. Static Web Apps is not offered in `southafricanorth`.

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
| Microsoft.Web/staticSites | 1 | Blocked | 10 Free static web apps per subscription | Quota source: Azure Static Web Apps limits. Usage cannot be read until `az login` succeeds as `islater88@outlook.com`. |
| Microsoft.Network/dnsZones | 1 | Blocked | 250 public zones per subscription | Quota source: Azure DNS limits. Usage cannot be read until sign-in. |

**Status:** Blocked. Sign-in succeeded and the account has no subscription, so live usage is zero and there is nothing to deploy into. After a subscription exists, read `az staticwebapp list` and `az network dns zone list` before create. Published limits remain 10 Free static web apps and 250 DNS zones per subscription.

---

## 7. Execution Checklist

### Phase 1: Planning

- [x] Workspace analyzed — existing Angular static site, not a new app
- [x] Requirements captured
- [x] Recipe selected — AZCLI
- [x] Architecture mapped — Static Web Apps Free + Azure DNS
- [x] Sign-in confirmed as `islater88@outlook.com` — no subscription on tenant `83b7fef4-fb21-4a3b-9290-9d3358f117d4`
- [ ] Live quota read — waiting for the same sign-in

### Phase 2: Execution

- [ ] `az group create`
- [ ] `az staticwebapp create` (Free, westeurope)
- [ ] Build `pnpm --filter @lekki/web run build`
- [ ] Deploy `apps/web/dist/web/browser` with the Static Web Apps CLI
- [ ] `az network dns zone create`
- [ ] Print the four Azure nameservers for the GoDaddy change
- [ ] After nameservers propagate, bind `lekki.co.za` and `www.lekki.co.za` and wait for the managed certificate

### Human step that cannot be done from this machine

GoDaddy → lekki.co.za → Nameservers → change to the four Azure nameservers printed by the deploy. Until that change, the site is live on `https://<name>.azurestaticapps.net` only.

---

## 8. Validation Proof

Not started. `azure-validate` runs after sign-in and after this status moves to `Ready for Validation`.
