#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SAITO DEPLOY SCRIPT
# Uso: bash deploy.sh [frontend|backend|all]
# Exemplo: bash deploy.sh frontend
#          bash deploy.sh backend
#          bash deploy.sh all
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TARGET=${1:-all}

echo "🚀 Saito Deploy — Target: $TARGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Apaga apenas o que vai ser atualizado
if [ "$TARGET" == "frontend" ] || [ "$TARGET" == "all" ]; then
  echo "🗑️  Removendo frontend antigo..."
  rm -rf frontend
fi
if [ "$TARGET" == "backend" ] || [ "$TARGET" == "all" ]; then
  echo "🗑️  Removendo backend antigo..."
  rm -rf backend
fi

# 2. Clona apenas os arquivos que precisam
echo "📦 Baixando atualização do GitHub..."
git clone --depth 1 https://github.com/Kadusk8/saito.git temp_repo

if [ "$TARGET" == "frontend" ] || [ "$TARGET" == "all" ]; then
  mv temp_repo/frontend ./frontend
fi
if [ "$TARGET" == "backend" ] || [ "$TARGET" == "all" ]; then
  mv temp_repo/backend ./backend
fi

# Sempre atualiza o docker-compose.yml
cp temp_repo/docker-compose.yml ./docker-compose.yml 2>/dev/null || true
rm -rf temp_repo
echo "✅ Código atualizado!"

# 3. Carrega as variáveis de ambiente
echo "🔑 Carregando variáveis de ambiente..."
set -a; source stack.env; set +a

# 4. Build apenas do target
echo "🔨 Fazendo build..."
docker compose build --no-cache $TARGET

# 5. Reinicia o(s) container(s)
echo "♻️  Reiniciando containers..."
if [ "$TARGET" == "all" ]; then
  docker rm -f saito-frontend saito-backend 2>/dev/null || true
else
  docker rm -f saito-$TARGET 2>/dev/null || true
fi
docker compose up -d

echo ""
echo "✅ Deploy concluído!"
echo "📋 Containers rodando:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep saito
