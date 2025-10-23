#!/bin/bash

# ========================================
# Script de Migração - Banco Existente
# Temelio DSP - Aplicar correções SEM perder dados
# ========================================

set -e

echo "🔧 Migração para Banco Existente - Temelio DSP"
echo "=============================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ========================================
# 1. VERIFICAÇÕES
# ========================================

echo -e "${BLUE}📋 Verificando ambiente...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script da raiz do projeto backend${NC}"
    exit 1
fi

if [ ! -d "prisma" ]; then
    echo -e "${RED}❌ Diretório prisma/ não encontrado${NC}"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ambiente OK${NC}"
echo ""

# ========================================
# 2. EXTRAIR DADOS DO .ENV
# ========================================

echo -e "${BLUE}🔍 Lendo configuração do banco...${NC}"

source .env

DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "Host: ${DB_HOST}:${DB_PORT}"
echo "Database: ${DB_NAME}"
echo ""

# ========================================
# 3. BACKUP DO BANCO
# ========================================

echo -e "${BLUE}💾 Criando backup do banco...${NC}"

BACKUP_FILE="backup_banco_$(date +%Y%m%d_%H%M%S).sql"

mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo -e "${GREEN}✅ Backup criado: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    exit 1
fi

echo ""

# ========================================
# 4. BACKUP DO SCHEMA ATUAL
# ========================================

echo -e "${BLUE}📂 Fazendo backup do schema atual...${NC}"

SCHEMA_BACKUP="prisma/schema.prisma.backup_$(date +%Y%m%d_%H%M%S)"
cp prisma/schema.prisma ${SCHEMA_BACKUP}

echo -e "${GREEN}✅ Schema backup: ${SCHEMA_BACKUP}${NC}"
echo ""

# ========================================
# 5. CRIAR BASELINE (0_init)
# ========================================

echo -e "${BLUE}🎯 Criando baseline do estado atual...${NC}"

# Verificar se já existe baseline
if [ -d "prisma/migrations/0_init" ]; then
    echo -e "${YELLOW}⚠️  Baseline já existe. Pulando...${NC}"
else
    # Criar diretório
    mkdir -p prisma/migrations/0_init
    
    # Gerar SQL do estado atual
    npx prisma migrate diff \
      --from-empty \
      --to-schema-datamodel prisma/schema.prisma \
      --script > prisma/migrations/0_init/migration.sql
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Baseline criada: prisma/migrations/0_init/${NC}"
        
        # Marcar como aplicada
        npx prisma migrate resolve --applied 0_init
        echo -e "${GREEN}✅ Baseline marcada como aplicada${NC}"
    else
        echo -e "${RED}❌ Erro ao criar baseline${NC}"
        exit 1
    fi
fi

echo ""

# ========================================
# 6. VERIFICAR E NORMALIZAR DADOS
# ========================================

echo -e "${BLUE}🔍 Verificando dados na coluna 'nivel'...${NC}"

# Mostrar valores atuais
echo "Valores encontrados:"
mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "SELECT DISTINCT nivel, COUNT(*) as qtd FROM motoristas GROUP BY nivel;" \
    2>/dev/null || echo "Tabela motoristas ainda não existe"

echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Vou normalizar os dados na coluna 'nivel'${NC}"
echo "Ações:"
echo "  1. Converter NULL/vazios para 'INICIANTE'"
echo "  2. Converter para MAIÚSCULAS"
echo "  3. Remover espaços"
echo ""
read -p "Continuar? (s/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}❌ Cancelado pelo usuário${NC}"
    exit 1
fi

echo -e "${BLUE}🔧 Normalizando dados...${NC}"

mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} <<EOF
-- Converter NULL para INICIANTE
UPDATE motoristas SET nivel = 'INICIANTE' WHERE nivel IS NULL OR nivel = '';

-- Converter para maiúsculas
UPDATE motoristas SET nivel = UPPER(TRIM(nivel));

-- Corrigir valores inválidos
UPDATE motoristas 
SET nivel = 'INICIANTE' 
WHERE nivel NOT IN ('INICIANTE', 'BRONZE', 'PRATA', 'OURO', 'ELITE');
EOF

echo -e "${GREEN}✅ Dados normalizados${NC}"

# Mostrar resultado
echo ""
echo "Valores após normalização:"
mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "SELECT DISTINCT nivel, COUNT(*) as qtd FROM motoristas GROUP BY nivel;"

echo ""

# ========================================
# 7. APLICAR NOVO SCHEMA
# ========================================

echo -e "${BLUE}📥 Aplicando novo schema...${NC}"

if [ ! -f "../outputs/schema.prisma" ]; then
    echo -e "${RED}❌ Arquivo schema.prisma não encontrado em ../outputs/${NC}"
    echo "Certifique-se de executar este script de dentro do diretório backend/"
    exit 1
fi

# Copiar novo schema
cp ../outputs/schema.prisma prisma/schema.prisma
echo -e "${GREEN}✅ Novo schema copiado${NC}"

# Mostrar diferenças
echo ""
echo -e "${YELLOW}📄 Diferenças que serão aplicadas:${NC}"
npx prisma migrate diff \
  --from-schema-datamodel ${SCHEMA_BACKUP} \
  --to-schema-datamodel prisma/schema.prisma \
  --script

echo ""
echo -e "${YELLOW}⚠️  Revise as mudanças acima cuidadosamente!${NC}"
echo ""
read -p "Aplicar estas mudanças? (s/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}❌ Cancelado. Restaurando schema anterior...${NC}"
    cp ${SCHEMA_BACKUP} prisma/schema.prisma
    exit 0
fi

# ========================================
# 8. CRIAR E APLICAR MIGRATION
# ========================================

echo -e "${BLUE}🔨 Criando migration...${NC}"

npx prisma migrate dev --name adicionar_nivel_motorista_e_rota_atribuicao

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao criar/aplicar migration${NC}"
    echo ""
    echo "Possível causa: conversão de tipo VARCHAR → ENUM"
    echo "Solução: Editar manualmente a migration"
    echo ""
    
    # Encontrar migration mais recente
    MIGRATION_DIR=$(ls -td prisma/migrations/*/ | head -1)
    
    if [ -n "$MIGRATION_DIR" ]; then
        echo "Migration gerada em: ${MIGRATION_DIR}"
        echo ""
        echo "Editando migration automaticamente..."
        
        # Backup da migration original
        cp "${MIGRATION_DIR}migration.sql" "${MIGRATION_DIR}migration.sql.original"
        
        # Criar nova migration com conversão segura
        cat > "${MIGRATION_DIR}migration.sql" <<'MIGRATION_SQL'
-- CreateEnum
CREATE TYPE "NivelMotorista" AS ENUM ('INICIANTE', 'BRONZE', 'PRATA', 'OURO', 'ELITE');

-- CreateEnum
CREATE TYPE "StatusRotaAtribuicao" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- AlterTable motoristas: Conversão segura de nivel
ALTER TABLE `motoristas` ADD COLUMN `nivel_temp` ENUM('INICIANTE','BRONZE','PRATA','OURO','ELITE') DEFAULT 'INICIANTE';

UPDATE `motoristas` 
SET `nivel_temp` = CASE 
  WHEN UPPER(nivel) = 'INICIANTE' THEN 'INICIANTE'
  WHEN UPPER(nivel) = 'BRONZE' THEN 'BRONZE'
  WHEN UPPER(nivel) = 'PRATA' THEN 'PRATA'
  WHEN UPPER(nivel) = 'OURO' THEN 'OURO'
  WHEN UPPER(nivel) = 'ELITE' THEN 'ELITE'
  ELSE 'INICIANTE'
END;

ALTER TABLE `motoristas` DROP COLUMN `nivel`;
ALTER TABLE `motoristas` CHANGE `nivel_temp` `nivel` ENUM('INICIANTE','BRONZE','PRATA','OURO','ELITE') NOT NULL DEFAULT 'INICIANTE';

-- CreateTable rotas_atribuicoes
CREATE TABLE `rotas_atribuicoes` (
    `id` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `dataRota` DATE NOT NULL,
    `turno` ENUM('MATUTINO', 'VESPERTINO', 'NOTURNO') NOT NULL,
    `tipoVeiculo` ENUM('MOTOCICLETA', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NOT NULL,
    `valorRota` DECIMAL(10, 2) NOT NULL,
    `kmReal` DECIMAL(10, 2) NULL,
    `status` ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `dataAceitacao` DATETIME(3) NULL,
    `dataInicio` DATETIME(3) NULL,
    `dataConclusao` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rotas_atribuicoes_motoristaId_status_idx`(`motoristaId`, `status`),
    INDEX `rotas_atribuicoes_dataRota_status_idx`(`dataRota`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rotas_atribuicoes` ADD CONSTRAINT `rotas_atribuicoes_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex motoristas
CREATE INDEX `motoristas_nivel_idx` ON `motoristas`(`nivel`);
MIGRATION_SQL
        
        echo -e "${GREEN}✅ Migration editada com conversão segura${NC}"
        echo ""
        echo "Aplicando migration..."
        
        # Aplicar migration manualmente
        npx prisma migrate deploy
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration aplicada com sucesso!${NC}"
        else
            echo -e "${RED}❌ Erro ao aplicar migration${NC}"
            echo "Para rollback:"
            echo "  mysql -u ${DB_USER} -p ${DB_NAME} < ${BACKUP_FILE}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✅ Migration aplicada com sucesso${NC}"
fi

echo ""

# ========================================
# 9. ATUALIZAR CONTROLLER
# ========================================

echo -e "${BLUE}💻 Atualizando controller...${NC}"

if [ -f "../outputs/motorista.dashboard.controller.ts" ]; then
    CONTROLLER_BACKUP="src/controllers/motorista.dashboard.controller.ts.backup_$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "src/controllers/motorista.dashboard.controller.ts" ]; then
        cp src/controllers/motorista.dashboard.controller.ts ${CONTROLLER_BACKUP}
        echo -e "${GREEN}✅ Controller backup: ${CONTROLLER_BACKUP}${NC}"
    fi
    
    cp ../outputs/motorista.dashboard.controller.ts src/controllers/motorista.dashboard.controller.ts
    echo -e "${GREEN}✅ Controller atualizado${NC}"
else
    echo -e "${YELLOW}⚠️  Controller não encontrado em ../outputs/, pulando...${NC}"
fi

echo ""

# ========================================
# 10. REGENERAR PRISMA CLIENT
# ========================================

echo -e "${BLUE}⚙️  Regenerando Prisma Client...${NC}"

rm -rf node_modules/.prisma
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client regenerado${NC}"
else
    echo -e "${RED}❌ Erro ao regenerar Prisma Client${NC}"
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
    echo -e "${RED}❌ Erro na compilação${NC}"
    exit 1
fi

echo ""

# ========================================
# 12. VALIDAÇÕES FINAIS
# ========================================

echo -e "${BLUE}🔍 Validações finais...${NC}"

echo ""
echo "Estrutura da coluna nivel:"
mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "SHOW COLUMNS FROM motoristas WHERE Field = 'nivel';"

echo ""
echo "Tabela rotas_atribuicoes:"
mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "SHOW TABLES LIKE 'rotas_atribuicoes';"

echo ""
echo "Contagem de registros:"
mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} \
    -e "SELECT 
          (SELECT COUNT(*) FROM motoristas) as motoristas,
          (SELECT COUNT(*) FROM rotas_atribuicoes) as rotas_atribuicoes;"

echo ""

# ========================================
# 13. SUCESSO
# ========================================

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║       ✅  MIGRAÇÃO CONCLUÍDA COM SUCESSO!         ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}📝 Arquivos importantes:${NC}"
echo "  Backup do banco: ${BACKUP_FILE}"
echo "  Backup do schema: ${SCHEMA_BACKUP}"
echo ""
echo -e "${BLUE}🚀 Próximos passos:${NC}"
echo "  1. Reiniciar servidor: npm run dev"
echo "  2. Testar endpoint: curl http://localhost:3000/api/motoristas/dashboard"
echo ""
echo -e "${GREEN}🎉 Tudo pronto!${NC}"
