-- Migração para renomear CICLO_SPEED para CICLO_2
-- Data: 2025-10-24
-- Descrição: Atualiza todas as referências de CICLO_SPEED para CICLO_2 conforme padronização da Amazon

-- Atualizar tabela rotas
UPDATE rotas
SET cicloRota = 'CICLO_2'
WHERE cicloRota = 'CICLO_SPEED';

-- Atualizar tabela disponibilidades
UPDATE disponibilidades
SET ciclo = 'CICLO_2'
WHERE ciclo = 'CICLO_SPEED';

-- Atualizar tabela historico_disponibilidades
UPDATE historico_disponibilidades
SET ciclo = 'CICLO_2'
WHERE ciclo = 'CICLO_SPEED';

-- Verificar resultados
SELECT 'rotas' as tabela, COUNT(*) as total_ciclo_2 FROM rotas WHERE cicloRota = 'CICLO_2'
UNION ALL
SELECT 'disponibilidades', COUNT(*) FROM disponibilidades WHERE ciclo = 'CICLO_2'
UNION ALL
SELECT 'historico_disponibilidades', COUNT(*) FROM historico_disponibilidades WHERE ciclo = 'CICLO_2';
