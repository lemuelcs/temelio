#!/bin/bash

# Script para criar toda a estrutura do projeto Backend
# Execute com: bash setup.sh

echo "🚀 Criando estrutura do projeto Backend..."

# Criar estrutura de pastas
echo "📁 Criando pastas..."
mkdir -p src/config
mkdir -p src/controllers
mkdir -p src/middlewares
mkdir -p src/routes
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils
mkdir -p prisma

echo "✅ Pastas criadas!"

# Criar arquivos vazios
echo "📄 Criando arquivos..."
touch src/server.ts
touch src/app.ts
touch src/config/database.ts
touch src/middlewares/error.middleware.ts
touch src/middlewares/auth.middleware.ts
touch src/services/auth.service.ts
touch src/services/motorista.service.ts
touch src/services/rota.service.ts
touch src/services/local.service.ts
touch src/services/preco.service.ts
touch src/controllers/auth.controller.ts
touch src/controllers/motorista.controller.ts
touch src/controllers/rota.controller.ts
touch src/routes/auth.routes.ts
touch src/routes/motorista.routes.ts
touch src/routes/rota.routes.ts
touch prisma/seed.ts

echo "✅ Arquivos criados!"

echo ""
echo "🎉 Estrutura criada com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Copie o conteúdo de cada artifact do Claude para o arquivo correspondente"
echo "2. Configure o .env"
echo "3. Execute: npm install"
echo "4. Execute: npx prisma migrate dev --name init"
echo "5. Execute: npx ts-node prisma/seed.ts"
echo "6. Execute: npm run dev"
echo ""