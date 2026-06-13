# Arquitetura Backent

## Visão Geral

A Backent é uma plataforma **multi-tenant** de backend-as-a-service projetada para escalar de **1 VPS** até **Kubernetes** sem reescrita arquitetural.

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX (Reverse Proxy)                    │
│              Rate Limit · SSL · Load Balance (Fase 2+)           │
└──────────┬──────────────┬──────────────┬────────────────────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐
    │   Landing   │ │    Web    │ │   Admin    │
    │  Next.js    │ │  Next.js  │ │  Next.js   │
    │  :3002      │ │  :3000    │ │  :3001     │
    └─────────────┘ └─────┬─────┘ └─────┬──────┘
                          │              │
                    ┌─────▼──────────────▼─────┐
                    │      NestJS API           │
                    │      Control Plane        │
                    │      :4000                │
                    ├───────────────────────────┤
                    │  Auth · Projects · Tables │
                    │  Dynamic API · Storage    │
                    │  Webhooks · Realtime      │
                    │  Billing · Admin          │
                    └─────┬──────┬──────┬───────┘
                          │      │      │
              ┌───────────▼──┐ ┌─▼───┐ ┌▼────────┐
              │  PostgreSQL  │ │Redis│ │  MinIO   │
              │  Multi-schema│ │Queue│ │  Storage │
              └──────────────┘ └─────┘ └──────────┘
```

## Multi-Tenancy

### Modelo: Schema-per-Tenant

Cada **projeto** recebe um schema PostgreSQL isolado:

```
backent_platform (database)
├── platform (schema)     ← Control plane (users, projects, billing)
├── tenant_ws1_app1       ← Projeto 1 do workspace 1
├── tenant_ws1_app2       ← Projeto 2 do workspace 1
└── tenant_ws2_saas       ← Projeto 1 do workspace 2
```

**Vantagens:**
- Isolamento forte (sem vazamento entre tenants)
- Backup/restore por projeto
- Migração entre VPS por schema
- Performance previsível

**Metadados** das tabelas ficam em `platform.project_tables` (JSON columns/indexes/relations).

## Fluxo de Provisionamento

```
Usuário cria projeto
        │
        ▼
Seleciona ServerNode (menor carga)
        │
        ▼
Gera schemaName, jwtSecret, slug
        │
        ▼
CREATE SCHEMA tenant_xxx
        │
        ▼
Cria tabelas meta + template (opcional)
        │
        ▼
Gera API Key + storage bucket
        │
        ▼
Status → ACTIVE
```

## Dynamic REST API

Toda tabela gera endpoints automaticamente:

```
GET    /api/v1/projects/:id/data/:table
POST   /api/v1/projects/:id/data/:table
PUT    /api/v1/projects/:id/data/:table/:recordId
DELETE /api/v1/projects/:id/data/:table/:recordId
```

Autenticação via `X-API-Key` header. Rate limit por plano.

## Escalabilidade — 3 Fases

### Fase 1 — Single VPS (atual)
- 1 VPS Ubuntu 400GB SSD
- Docker Compose
- Multi-tenant por schema
- ~100 projetos por VPS

### Fase 2 — Multi-VPS
- `ServerNode` registry no control plane
- Nginx load balancer
- Migração automática de schemas entre VPS
- Read replicas PostgreSQL

### Fase 3 — Kubernetes
- Helm charts
- PostgreSQL cluster (Patroni/CNPG)
- HPA autoscaling
- Edge functions (Workers)

## Segurança

| Camada | Implementação |
|--------|--------------|
| Transport | HTTPS/TLS (Nginx) |
| Auth | JWT + Refresh Tokens, API Keys SHA-256 |
| API | Helmet, CORS, Rate Limit, Validation |
| DB | Schema isolation, parameterized queries |
| Storage | Bucket per project, presigned URLs |
| Audit | AuditLog em todas ações críticas |

## Observabilidade

```
API → Prometheus (métricas)
    → Loki (logs)
    → Grafana (dashboards + alertas)
```

Health check: `GET /api/v1/health`

## Clean Architecture (Backend)

```
apps/api/src/
├── modules/           # Feature modules (NestJS)
│   ├── auth/
│   ├── projects/
│   ├── tables/
│   ├── dynamic-api/
│   └── ...
├── common/            # Guards, decorators, filters
├── prisma/            # Database service
└── main.ts
```

Cada módulo segue:
- **Controller** — HTTP layer
- **Service** — Business logic
- **DTO** — Validation

## Billing

Planos armazenados em `platform.plans`. Limites verificados em:
- Criação de projetos
- Criação de tabelas
- API requests (UsageMetric diário)
- Storage bytes

Integração Stripe/Mercado Pago preparada via `Subscription` model.

## Realtime

WebSocket namespace `/realtime`:
- `subscribe` → `{ projectId, table }`
- Events: `change` → `{ event, table, record }`

Disparado após INSERT/UPDATE/DELETE na Dynamic API.

## Webhooks

BullMQ queue `webhooks`:
1. Evento CRUD na Dynamic API
2. Job enfileirado por webhook matching
3. HTTP POST com retry (3x)
4. Delivery log em `webhook_deliveries`
