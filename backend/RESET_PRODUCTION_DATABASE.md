# Script para Resetar Banco de Dados de Produção

⚠️ **ATENÇÃO: Este procedimento APAGARÁ TODOS OS DADOS do banco de produção!**

Execute estes passos no servidor de produção (`srv1083983`).

## Passo 1: Backup do Banco Atual (IMPORTANTE!)

```bash
# 1.1 Criar diretório para backups
mkdir -p ~/backups
cd ~/backups

# 1.2 Fazer backup completo do banco
mysqldump -u root -p temello_db > temello_db_backup_$(date +%Y%m%d_%H%M%S).sql

# 1.3 Verificar que o backup foi criado
ls -lh temello_db_backup_*.sql
```

## Passo 2: Resolver Migration Falha e Limpar Banco

```bash
# 2.1 Conectar ao MySQL
mysql -u root -p

# 2.2 Executar os comandos SQL abaixo:
```

```sql
-- Selecionar o banco de dados
USE temello_db;

-- Ver o status da migration falha
SELECT * FROM _prisma_migrations WHERE migration_name = '20250311120000_drop_tabela_preco_legacy_columns';

-- Dropar completamente o banco de dados
DROP DATABASE temello_db;

-- Recriar o banco vazio
CREATE DATABASE temello_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sair do MySQL
EXIT;
```

## Passo 3: Aplicar Migrations do Zero

```bash
# 3.1 Voltar para o diretório do backend
cd ~/app/temelio/backend

# 3.2 Aplicar todas as migrations
npx prisma migrate deploy

# 3.3 Verificar status
npx prisma migrate status
```

## Passo 4: Verificar Estrutura do Banco

```bash
# 4.1 Conectar ao MySQL novamente
mysql -u root -p

# 4.2 Verificar as tabelas criadas
```

```sql
USE temello_db;

-- Listar todas as tabelas
SHOW TABLES;

-- Verificar estrutura da tabela tabelas_precos
DESCRIBE tabelas_precos;

-- Verificar estrutura da tabela motoristas
DESCRIBE motoristas;

-- Verificar migrations aplicadas
SELECT migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY finished_at;

EXIT;
```

## Passo 5: (Opcional) Restaurar Dados do Backup

Se você precisar restaurar alguns dados do backup anterior:

```bash
# Restaurar o backup completo
mysql -u root -p temello_db < ~/backups/temello_db_backup_[DATA_HORA].sql
```

---

## Alternativa: Resolver Migration Falha Sem Dropar

Se você preferir **não apagar** o banco, pode marcar a migration falha como resolvida:

```bash
# Conectar ao MySQL
mysql -u root -p
```

```sql
USE temello_db;

-- Marcar a migration como concluída (rolled back)
UPDATE _prisma_migrations
SET finished_at = NOW(),
    applied_steps_count = 0,
    logs = 'Migration marcada como resolvida manualmente'
WHERE migration_name = '20250311120000_drop_tabela_preco_legacy_columns';

-- Verificar
SELECT * FROM _prisma_migrations WHERE migration_name = '20250311120000_drop_tabela_preco_legacy_columns';

EXIT;
```

Depois execute:

```bash
npx prisma migrate deploy
```

---

## Troubleshooting

### Se o comando `npx prisma migrate deploy` falhar novamente:

1. Verifique a conexão com o banco no arquivo `.env`
2. Certifique-se que o usuário MySQL tem permissões adequadas
3. Verifique os logs de erro no terminal

### Se precisar verificar permissões do usuário MySQL:

```sql
-- Conectar como root
mysql -u root -p

-- Verificar permissões
SHOW GRANTS FOR 'seu_usuario'@'localhost';

-- Dar todas as permissões se necessário
GRANT ALL PRIVILEGES ON temello_db.* TO 'seu_usuario'@'localhost';
FLUSH PRIVILEGES;
```
