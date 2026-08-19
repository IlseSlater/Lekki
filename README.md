# Lekki

Helping people spend less time waiting and more time together.

**Lekki is an Operating System for Human Experiences.** One product: **LEOS**.

**Phase: Construction.** [docs/LEKKI-BUILD.md](docs/LEKKI-BUILD.md) · [docs/LEKKI-MAP.md](docs/LEKKI-MAP.md)  
**Constitution:** [North Star](docs/NORTH-STAR.md) · [HXE](docs/LEK-040-human-experience-engineering.md) · [Delivery OS](docs/LEOS-DELIVERY-SYSTEM.md)

~95% build / 5% doc. Say **`Continue building Lekki`** or **`Build Story G-06`**.


## Stack (this repo — Phase 2 vertical slice)

- NestJS runtime host (`apps/runtime`)
- Angular PWA (`apps/web`)
- PostgreSQL + Prisma
- Socket.IO projections
- pnpm workspaces

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm run dev            # Postgres + Prisma + runtime + web, one command
```

| Surface | URL |
|---------|-----|
| Web | http://localhost:4200/ |
| Entry | http://localhost:4200/entry |
| Guest | http://localhost:4200/guest |
| Runtime API | http://localhost:3000 |
| Health | http://localhost:3000/health |

Demo QR tokens: `qr-demo-restaurant`, `qr-demo-cafe`, `qr-demo-hotel`, `qr-demo-festival`, `qr-demo-airport`, `qr-demo-healthcare`

**Package manager:** [pnpm](https://pnpm.io) (pinned in `packageManager`). Install with `npm install -g pnpm` or `corepack enable && corepack prepare pnpm@11.13.1 --activate`.

```bash
pnpm run proof           # architectural proof
pnpm run check:payfast   # PayFast connector self-check (no network)
pnpm run e2e:smoke       # heartbeat e2e with runtime
pnpm run check:nouns     # no pack nouns in core
```

Docs: [docs/LEOS.md](docs/LEOS.md) · [docs/LEKKI-BUILD.md](docs/LEKKI-BUILD.md)
