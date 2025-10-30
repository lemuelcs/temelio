#!/bin/bash
# Script de deploy/atualização da aplicação Temelio - Produção
# Branch: main

set -e  # Parar se houver erro

# Configurações
PROJECT_DIR="$HOME/app/temelio"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend-web"
LOG_DIR="$HOME/logs/deploy"
BACKUP_DIR="$HOME/backups/database"
BRANCH="main"

# Criar diretórios se não existirem
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# Arquivo de log com timestamp
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

# Função para log
log() {
    echo "[$(date +%Y-%m-%d\ %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

# Função para log de erro
log_error() {
    echo "[$(date +%Y-%m-%d\ %H:%M:%S)] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

# Função para backup do banco de dados
backup_database() {
    log "📦 Criando backup do banco de dados..."

    # Carregar variáveis de ambiente do backend
    if [ -f "$BACKEND_DIR/.env" ]; then
        export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)
    else
        log_error "Arquivo .env não encontrado!"
        exit 1
    fi

    # Nome do arquivo de backup
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

    # Extrair informações de conexão da DATABASE_URL
    # Formato: mysql://user:password@host:port/database
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

    # Fazer backup
    if mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        log "✅ Backup criado: $BACKUP_FILE"

        # Manter apenas os últimos 7 backups
        ls -t "$BACKUP_DIR"/backup-*.sql | tail -n +8 | xargs -r rm
        log "🧹 Backups antigos removidos (mantendo últimos 7)"
    else
        log_error "Falha ao criar backup do banco de dados"
        exit 1
    fi
}

# Função para verificar saúde do backend
health_check_backend() {
    log "🏥 Verificando saúde do backend..."

    # Tentar 10 vezes com intervalo de 2 segundos
    for i in {1..10}; do
        if pm2 describe temelio-backend | grep -q "online"; then
            log "✅ Backend está rodando corretamente!"
            return 0
        fi
        log "⏳ Aguardando backend iniciar (tentativa $i/10)..."
        sleep 2
    done

    log_error "Backend não iniciou corretamente após 20 segundos"
    return 1
}

# Início do deploy
log "🚀 Iniciando deploy da Temelio em produção (branch: $BRANCH)..."

# Ir para pasta do projeto
cd "$PROJECT_DIR" || {
    log_error "Pasta do projeto não encontrada: $PROJECT_DIR"
    exit 1
}

# Verificar se há mudanças locais não commitadas
log "🔍 Verificando status do Git..."
if [[ -n $(git status -s) ]]; then
    log_error "Existem mudanças locais não commitadas. Execute 'git status' para ver."
    log_error "Faça commit ou descarte as mudanças antes do deploy."
    exit 1
fi

# Salvar commit atual para possível rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
log "📌 Commit atual: $CURRENT_COMMIT"

# Atualizar código do Git
log "📥 Atualizando código da branch $BRANCH..."
if git fetch origin "$BRANCH"; then
    REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH")

    if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
        log "ℹ️  Já está na versão mais recente. Nenhuma atualização necessária."
        log "✅ Deploy finalizado - nenhuma mudança detectada."
        exit 0
    fi

    log "🔄 Atualizando de $CURRENT_COMMIT para $REMOTE_COMMIT"
    git pull origin "$BRANCH"
else
    log_error "Falha ao buscar atualizações do repositório"
    exit 1
fi

# Backup do banco de dados antes das migrations
backup_database

# Backend
log ""
log "🔧 Atualizando backend..."
cd "$BACKEND_DIR" || {
    log_error "Pasta do backend não encontrada: $BACKEND_DIR"
    exit 1
}

# Instalar dependências (incluindo devDependencies para o build)
log "📦 Instalando dependências do backend..."
if npm ci; then
    log "✅ Dependências instaladas"
else
    log_error "Falha ao instalar dependências do backend"
    exit 1
fi

# Gerar Prisma Client
log "⚙️  Gerando Prisma Client..."
if npx prisma generate; then
    log "✅ Prisma Client gerado"
else
    log_error "Falha ao gerar Prisma Client"
    exit 1
fi

# Rodar migrations
log "🗄️  Aplicando migrations do banco de dados..."
if npx prisma migrate deploy; then
    log "✅ Migrations aplicadas com sucesso"
else
    log_error "Falha ao aplicar migrations"
    log_error "Backup disponível em: $BACKUP_FILE"
    exit 1
fi

# Build do backend
log "🔨 Compilando backend..."
if npm run build; then
    log "✅ Backend compilado"
else
    log_error "Falha ao compilar backend"
    exit 1
fi

# Reiniciar PM2
log "🔄 Reiniciando backend (PM2)..."
if pm2 restart temelio-backend; then
    log "✅ Backend reiniciado"
else
    log_error "Falha ao reiniciar backend"
    exit 1
fi

# Health check do backend
if ! health_check_backend; then
    log_error "Backend falhou no health check"
    log "🔙 Considere fazer rollback para o commit: $CURRENT_COMMIT"
    exit 1
fi

# Frontend
log ""
log "🎨 Atualizando frontend..."
cd "$FRONTEND_DIR" || {
    log_error "Pasta do frontend não encontrada: $FRONTEND_DIR"
    exit 1
}

# Instalar dependências
log "📦 Instalando dependências do frontend..."
if npm ci; then
    log "✅ Dependências instaladas"
else
    log_error "Falha ao instalar dependências do frontend"
    exit 1
fi

# Build do frontend
log "🔨 Compilando frontend..."
if npx vite build; then
    log "✅ Frontend compilado"
else
    log_error "Falha ao compilar frontend"
    exit 1
fi

# Deploy do frontend
log "📤 Publicando frontend..."
if sudo rm -rf /var/www/temelio/* && \
   sudo cp -r dist/* /var/www/temelio/ && \
   sudo chown -R www-data:www-data /var/www/temelio; then
    log "✅ Frontend publicado"
else
    log_error "Falha ao publicar frontend"
    exit 1
fi

# Status final
log ""
log "✅ Deploy concluído com sucesso!"
log ""
log "📊 Status dos serviços:"
pm2 status | tee -a "$LOG_FILE"

log ""
log "📝 Informações do deploy:"
log "   - Commit anterior: $CURRENT_COMMIT"
log "   - Commit atual: $(git rev-parse HEAD)"
log "   - Backup do banco: $BACKUP_FILE"
log "   - Log completo: $LOG_FILE"
log ""
log "🌐 Aplicação disponível em: https://app.temelio.com.br"
