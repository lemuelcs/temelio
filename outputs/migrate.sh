#!/bin/bash

# ========================================
# Script de Migração - Temelio DSP
# Atualização: Sistema de Níveis + RotaAtribuicao
# ========================================

set -e  # Parar execução em caso de erro

echo "🚀 Iniciando processo de migração..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# 1. VERIFICAÇÕES INICIAIS
# ========================================

echo -e "${BLUE}📋 Verificações iniciais...${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script da raiz do projeto backend${NC}"
    exit 1
fi

if [ ! -d "prisma" ]; then
    echo -e "${RED}❌ Erro: Diretório prisma/ não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Verificações OK${NC}"
echo ""

# ========================================
# 2. BACKUP DO BANCO DE DADOS
# ========================================

echo -e "${BLUE}💾 Criando backup do banco de dados...${NC}"

# Extrair dados de conexão do .env
if [ -f ".env" ]; then
    source .env
else
    echo -e "${RED}❌ Erro: Arquivo .env não encontrado${NC}"
    exit 1
fi

# Extrair componentes da DATABASE_URL
# Formato: mysql://user:pass@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Conectando em: ${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Criar backup
mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup criado: ${BACKUP_FILE}${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    exit 1
fi

echo ""

# ========================================
# 3. BACKUP DOS ARQUIVOS ATUAIS
# ========================================

echo -e "${BLUE}📂 Fazendo backup dos arquivos atuais...${NC}"

# Backup do schema
cp prisma/schema.prisma prisma/schema.prisma.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Schema backup criado${NC}"

# Backup do controller (se existir)
if [ -f "src/controllers/motorista.dashboard.controller.ts" ]; then
    cp src/controllers/motorista.dashboard.controller.ts \
       src/controllers/motorista.dashboard.controller.ts.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Controller backup criado${NC}"
fi

echo ""

# ========================================
# 4. VERIFICAR DADOS ATUAIS
# ========================================

echo -e "${BLUE}🔍 Verificando dados atuais do campo 'nivel'...${NC}"

mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "SELECT COUNT(*) as total, nivel FROM motoristas GROUP BY nivel;"

echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Verifique se os valores acima estão corretos:${NC}"
echo "   Valores esperados: INICIANTE, BRONZE, PRATA, OURO, ELITE"
echo ""
read -p "Continuar com a migração? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}❌ Migração cancelada pelo usuário${NC}"
    exit 1
fi

# ========================================
# 5. NORMALIZAR DADOS (se necessário)
# ========================================

echo -e "${BLUE}🔧 Normalizando dados existentes...${NC}"

mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} <<EOF
-- Converter NULL para INICIANTE
UPDATE motoristas SET nivel = 'INICIANTE' WHERE nivel IS NULL OR nivel = '';

-- Converter para maiúsculas
UPDATE motoristas SET nivel = UPPER(nivel);

-- Remover espaços
UPDATE motoristas SET nivel = TRIM(nivel);
EOF

echo -e "${GREEN}✅ Dados normalizados${NC}"
echo ""

# ========================================
# 6. COPIAR NOVOS ARQUIVOS
# ========================================

echo -e "${BLUE}📥 Copiando novos arquivos...${NC}"

# Verificar se os arquivos novos existem
if [ ! -f "../outputs/schema.prisma" ]; then
    echo -e "${RED}❌ Erro: Arquivo schema.prisma não encontrado em /outputs/${NC}"
    echo "Execute este script de dentro do diretório backend/"
    exit 1
fi

# Copiar novo schema
cp ../outputs/schema.prisma prisma/schema.prisma
echo -e "${GREEN}✅ Novo schema copiado${NC}"

# Copiar novo controller
if [ -f "../outputs/motorista.dashboard.controller.ts" ]; then
    cp ../outputs/motorista.dashboard.controller.ts src/controllers/motorista.dashboard.controller.ts
    echo -e "${GREEN}✅ Novo controller copiado${NC}"
fi

echo ""

# ========================================
# 7. GERAR MIGRATION
# ========================================

echo -e "${BLUE}🔨 Gerando migration...${NC}"

npx prisma migrate dev --name adicionar_nivel_motorista_e_rota_atribuicao --create-only

echo -e "${GREEN}✅ Migration gerada${NC}"
echo ""

# ========================================
# 8. REVISAR MIGRATION
# ========================================

echo -e "${YELLOW}📄 Migration SQL gerada:${NC}"
echo ""

# Encontrar a migration mais recente
MIGRATION_FILE=$(ls -t prisma/migrations/*/migration.sql | head -1)

if [ -f "$MIGRATION_FILE" ]; then
    cat "$MIGRATION_FILE"
    echo ""
    echo -e "${YELLOW}⚠️  Revise a migration acima cuidadosamente!${NC}"
    echo ""
    read -p "Aplicar esta migration? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}❌ Migration não aplicada. Você pode aplicá-la manualmente depois.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Erro: Arquivo de migration não encontrado${NC}"
    exit 1
fi

# ========================================
# 9. APLICAR MIGRATION
# ========================================

echo -e "${BLUE}🚀 Aplicando migration no banco...${NC}"

npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration aplicada com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar migration${NC}"
    echo "Para restaurar o backup:"
    echo "  mysql -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_FILE}"
    exit 1
fi

echo ""

# ========================================
# 10. GERAR PRISMA CLIENT
# ========================================

echo -e "${BLUE}⚙️  Gerando Prisma Client...${NC}"

npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client gerado${NC}"
else
    echo -e "${RED}❌ Erro ao gerar Prisma Client${NC}"
    exit 1
fi

echo ""

# ========================================
# 11. COMPILAR TYPESCRIPT
# ========================================

echo -e "${BLUE}🔧 Compilando TypeScript...${NC}"

npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Compilação bem-sucedida${NC}"
else
    echo -e "${RED}❌ Erro na compilação TypeScript${NC}"
    echo "Verifique os erros acima e corrija-os."
    exit 1
fi

echo ""

# ========================================
# 12. VERIFICAÇÕES FINAIS
# ========================================

echo -e "${BLUE}🔍 Verificações finais...${NC}"

# Verificar estrutura da nova tabela
echo "Estrutura da tabela rotas_atribuicoes:"
mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "DESCRIBE rotas_atribuicoes;"

echo ""

# Verificar enum de níveis
echo "Verificando coluna nivel:"
mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "SHOW COLUMNS FROM motoristas WHERE Field = 'nivel';"

echo ""

# ========================================
# 13. SUCESSO!
# ========================================

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║       ✅  MIGRAÇÃO CONCLUÍDA COM SUCESSO!         ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo ""
echo "1. Reiniciar o servidor:"
echo "   npm run dev"
echo ""
echo "2. Testar o endpoint do dashboard:"
echo "   curl http://localhost:3000/api/motoristas/dashboard"
echo ""
echo "3. Se houver problemas, restaurar backup:"
echo "   mysql -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_FILE}"
echo ""
echo -e "${GREEN}Backup criado em: ${BACKUP_FILE}${NC}"
echo ""

# ========================================
# 14. POPULAR TABELA ROTA_ATRIBUICAO (OPCIONAL)
# ========================================

echo -e "${YELLOW}🔄 Popular tabela rotas_atribuicoes com dados históricos?${NC}"
read -p "Deseja popular a nova tabela agora? (s/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}📊 Populando rotas_atribuicoes...${NC}"
    
    mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} <<EOF
INSERT INTO rotas_atribuicoes (
  id, motoristaId, dataRota, turno, tipoVeiculo, valorRota, 
  status, dataConclusao, createdAt, updatedAt
)
SELECT 
  UUID(),
  motoristaId,
  dataRota,
  'MATUTINO',
  tipoVeiculo,
  valorTotalRota,
  CASE 
    WHEN status = 'CONCLUIDA' THEN 'CONCLUIDA'
    WHEN status = 'EM_ANDAMENTO' THEN 'EM_ANDAMENTO'
    ELSE 'PENDENTE'
  END,
  horaFimReal,
  createdAt,
  updatedAt
FROM rotas
WHERE motoristaId IS NOT NULL;
EOF
    
    # Contar registros inseridos
    COUNT=$(mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
        -se "SELECT COUNT(*) FROM rotas_atribuicoes;")
    
    echo -e "${GREEN}✅ ${COUNT} rotas importadas para rotas_atribuicoes${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Processo completo!${NC}"
