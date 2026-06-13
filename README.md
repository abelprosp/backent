# Backent

> **Seu backend pronto em minutos.**

Plataforma SaaS de banco de dados e backend para aplicativos no-code. Mistura o melhor de Supabase, Firebase, PlanetScale e Xano — com foco total em simplicidade, performance e onboarding rápido.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Framer Motion |
| Backend | NestJS, TypeScript, Prisma |
| Banco | PostgreSQL (multi-tenant por schema) |
| Cache/Filas | Redis, BullMQ |
| Storage | MinIO (S3-compatible) |
| Infra | Docker, Nginx, Prometheus, Grafana, Loki |
| Monorepo | Turborepo + pnpm workspaces |

## Estrutura

```
backent/
├── apps/
│   ├── api/          # NestJS — control plane + dynamic API
│   ├── web/          # Dashboard cliente
│   ├── admin/        # Painel administrativo
│   └── landing/      # Landing page
├── packages/
│   ├── database/     # Prisma schema + migrations
│   ├── shared/       # Types, constants, utils
│   ├── sdk-js/       # JavaScript/TypeScript SDK
│   ├── sdk-python/   # Python SDK
│   └── sdk-php/      # PHP SDK
├── docker/           # Docker Compose + Nginx + observability
├── scripts/          # Setup e automação
└── docs/             # Arquitetura e roadmap
```

## Quick Start

```bash
# Clone e setup
cp .env.example .env
bash scripts/setup.sh

# Desenvolvimento (com ou sem pnpm global)
pnpm dev
# se pnpm não estiver instalado:
npx --yes pnpm@9.15.0 dev

# Stack completa com Docker
pnpm docker:up
```

## URLs (dev)

| Serviço | URL |
|---------|-----|
| Landing | http://localhost:3002 |
| Dashboard | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/docs |
| MinIO Console | http://localhost:9001 |
| Grafana | http://localhost:3003 |

**Admin demo:** `admin@backent.io` / `admin123!`

## Funcionalidades

- ✅ Multi-tenant com isolamento por schema PostgreSQL
- ✅ Provisionamento automático (schema, API, storage, tokens)
- ✅ REST API dinâmica por tabela
- ✅ Auth JWT + refresh tokens + magic link
- ✅ Storage S3-compatible (MinIO)
- ✅ Webhooks com fila BullMQ
- ✅ Realtime WebSocket
- ✅ Conectores no-code (Bubble, N8N, Make, etc.)
- ✅ Templates de projeto
- ✅ Billing (planos Free/Pro/Business/Enterprise)
- ✅ Painel admin (migração VPS, audit logs)
- ✅ SDKs JS, Python, PHP
- ✅ Observabilidade (Prometheus, Grafana, Loki)

## SDK Example

```typescript
import BackentClient from '@backent/sdk-js';

const client = new BackentClient({
  apiUrl: 'https://api.backent.io/projects/xxx/data',
  apiKey: 'bk_your_api_key',
});

const users = await client.table('users').list({ page: 1, limit: 20 });
await client.table('users').create({ email: 'user@example.com', name: 'User' });
```

## Documentação

- [Arquitetura](./docs/ARCHITECTURE.md)
- [Roadmap](./docs/ROADMAP.md)

## Licença

Proprietary — Backent © 2026
# backent
