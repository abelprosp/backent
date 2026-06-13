#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Backent Setup"
echo "================"

# Usa pnpm global se existir; senão npx (sem precisar de sudo/corepack)
if command -v pnpm &> /dev/null; then
  PNPM="pnpm"
else
  echo "📦 pnpm não encontrado — usando npx (sem instalação global)"
  PNPM="npx --yes pnpm@9.15.0"
fi

if [ ! -f .env ]; then
  echo "📝 Criando .env a partir de .env.example..."
  cp .env.example .env
fi

# Garante DATABASE_URL para comandos Prisma
if ! grep -q '^DATABASE_URL=' .env 2>/dev/null; then
  echo 'DATABASE_URL="postgresql://backent:backent_secret@localhost:5432/backent_platform?schema=platform"' >> .env
fi

echo "📦 Instalando dependências..."
$PNPM install

if ! command -v docker &> /dev/null; then
  echo "❌ Docker não encontrado. Instale Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

echo "🐳 Subindo infraestrutura (PostgreSQL, Redis, MinIO)..."
docker compose -f docker/docker-compose.yml up -d postgres redis minio --force-recreate

echo "⏳ Aguardando PostgreSQL..."
for i in {1..30}; do
  if docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U backent -d backent_platform &>/dev/null; then
    break
  fi
  sleep 1
done

echo "🗄️  Gerando Prisma Client..."
$PNPM db:generate

echo "🗄️  Executando migrations..."
$PNPM db:push

echo "🌱 Seed do banco..."
$PNPM db:seed

echo ""
echo "✅ Setup completo!"
echo ""
echo "Para iniciar o desenvolvimento:"
echo "  1. Infra (se ainda não estiver rodando):"
echo "     docker compose -f docker/docker-compose.yml up -d postgres redis minio"
echo "  2. Apps (API + Dashboard + Landing + Admin):"
if command -v pnpm &> /dev/null; then
  echo "     pnpm dev"
else
  echo "     npx --yes pnpm@9.15.0 dev"
fi
echo ""
echo "  ⚠️  O login só funciona com a API rodando (porta 4000)"
echo "URLs:"
echo "  Landing:   http://localhost:3002"
echo "  Dashboard: http://localhost:3000"
echo "  Admin:     http://localhost:3001"
echo "  API:       http://localhost:4000"
echo "  Swagger:   http://localhost:4000/docs"
echo "  Grafana:   http://localhost:3003"
echo ""
echo "Admin demo: admin@backent.io / admin123!"
