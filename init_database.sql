-- ==========================================
-- SQL para Inicialização do Banco de Dados Temelio
-- ==========================================
-- Este script insere:
-- - 2 Usuários (admin@temelio.com.br e motorista@temelio.com.br)
-- - 1 Motorista completo
-- - 3 Locais (DBS5, DGO2, TAG001)
-- - 14 Tabelas de Preços (7 para DBS5 e 7 para DGO2)
--
-- Senha para ambos os usuários: temelio123
-- Hash bcrypt: $2b$10$2ZAb6xxVeksIJNLMY0R1Juq9xHzJg2mrcdgxea22hr3PrPNzgvIWK
-- ==========================================

SET @senha_hash = '$2b$10$2ZAb6xxVeksIJNLMY0R1Juq9xHzJg2mrcdgxea22hr3PrPNzgvIWK';

-- ==========================================
-- 1. USUÁRIOS
-- ==========================================

-- Usuário Administrador
INSERT INTO usuarios (id, email, senha, nome, perfil, ativo, deveAlterarSenha, createdAt, updatedAt)
VALUES (
  'admin_temelio_001',
  'admin@temelio.com.br',
  @senha_hash,
  'Administrador Sistema',
  'ADMINISTRADOR',
  true,
  false,
  NOW(),
  NOW()
);

-- Usuário Motorista
INSERT INTO usuarios (id, email, senha, nome, perfil, ativo, deveAlterarSenha, createdAt, updatedAt)
VALUES (
  'motorista_user_001',
  'motorista@temelio.com.br',
  @senha_hash,
  'Motorista Temelio',
  'MOTORISTA',
  true,
  false,
  NOW(),
  NOW()
);

-- ==========================================
-- 2. LOCAIS / ESTAÇÕES
-- ==========================================

-- DBS5 - Brasília
INSERT INTO locais (id, codigo, nome, endereco, latitude, longitude, cidade, bairro, uf, cep, ativo, createdAt, updatedAt)
VALUES (
  'local_dbs5_001',
  'DBS5',
  'Centro de Distribuição Brasília (DBS5)',
  'SAAN Quadra 1 Conjunto A, Brasília - DF',
  -15.7942,
  -47.8825,
  'Brasília',
  'Asa Norte',
  'DF',
  NULL,
  true,
  NOW(),
  NOW()
);

-- DGO2 - Hidrolândia
INSERT INTO locais (id, codigo, nome, endereco, latitude, longitude, cidade, bairro, uf, cep, ativo, createdAt, updatedAt)
VALUES (
  'local_dgo2_001',
  'DGO2',
  'Hub Hidrolândia (DGO2)',
  'Rodovia GO-010, Hidrolândia - GO',
  -16.9619,
  -49.2297,
  'Hidrolândia',
  'Zona Industrial',
  'GO',
  NULL,
  true,
  NOW(),
  NOW()
);

-- TAG001 - Taguatinga
INSERT INTO locais (id, codigo, nome, endereco, latitude, longitude, cidade, bairro, uf, cep, ativo, createdAt, updatedAt)
VALUES (
  'local_tag001_001',
  'TAG001',
  'Estação Taguatinga',
  'QNM 40, Taguatinga - DF',
  -15.8267,
  -48.0553,
  'Taguatinga',
  'Taguatinga Norte',
  'DF',
  NULL,
  true,
  NOW(),
  NOW()
);

-- ==========================================
-- 3. MOTORISTA
-- ==========================================

-- Registro do Motorista
INSERT INTO motoristas (
  id, transporterId, nomeCompleto, celular, cep, logradouro, numero, complemento,
  cidade, uf, bairro, cpf, dataNascimento, email, chavePix, tipoVeiculo,
  propriedadeVeiculo, status, pontuacao, anoFabricacaoVeiculo, placaVeiculo,
  primeiraRotaNursery, iniciouNurseryL1, iniciouNurseryL2, nivel, usuarioId,
  createdAt, updatedAt
)
VALUES (
  'motorista_001',
  '12345678000190',
  'Motorista Temelio Silva',
  '61987654321',
  NULL,
  NULL,
  NULL,
  NULL,
  'Brasília',
  'DF',
  'Asa Sul',
  '12345678901',
  '1990-01-01',
  'motorista@temelio.com.br',
  '61987654321',
  'CARGO_VAN',
  'PROPRIO',
  'ATIVO',
  4.5,
  2020,
  'ABC1234',
  NULL,
  NULL,
  NULL,
  'INICIANTE',
  'motorista_user_001',
  NOW(),
  NOW()
);

-- Documento do Motorista
INSERT INTO documentos_motoristas (
  id, motoristaId, numeroCNH, validadeCNH, anoLicenciamento,
  dataVerificacaoBRK, proximaVerificacaoBRK, statusBRK, createdAt, updatedAt
)
VALUES (
  'doc_motorista_001',
  'motorista_001',
  '12345678901',
  '2027-12-31',
  2025,
  '2025-01-15',
  '2026-01-15',
  true,
  NOW(),
  NOW()
);

-- Contrato do Motorista
INSERT INTO contratos_motoristas (
  id, motoristaId, numeroContrato, dataAssinatura, dataVigenciaInicial,
  ativo, cnpjMEI, razaoSocialMEI, createdAt, updatedAt
)
VALUES (
  'contrato_mot_001',
  'motorista_001',
  'CONT-2025-001',
  '2025-01-01',
  '2025-01-01',
  true,
  '12345678000190',
  'MOTORISTA TEMELIO SILVA TRANSPORTES',
  NOW(),
  NOW()
);

-- ==========================================
-- 4. TABELAS DE PREÇOS - DBS5 (Brasília)
-- ==========================================

-- DBS5 - BIKE PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dbs5_bike_001',
  'BIKE',
  'PROPRIO',
  1,
  'DBS5',
  27.00,
  6.75,
  0.00,
  5.75,
  35.25,
  8.75,
  6.75,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DBS5 - CARGO_VAN PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dbs5_cargovan_p_001',
  'CARGO_VAN',
  'PROPRIO',
  1,
  'DBS5',
  40.00,
  10.00,
  0.64,
  8.50,
  50.00,
  12.50,
  9.75,
  0.25,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DBS5 - CARGO_VAN TRANSPORTADORA
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dbs5_cargovan_t_001',
  'CARGO_VAN',
  'TRANSPORTADORA',
  1,
  'DBS5',
  25.00,
  6.25,
  0.00,
  5.50,
  NULL,
  NULL,
  NULL,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DBS5 - LARGE_VAN PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dbs5_largevan_p_001',
  'LARGE_VAN',
  'PROPRIO',
  1,
  'DBS5',
  52.50,
  13.25,
  0.64,
  11.25,
  64.25,
  16.00,
  13.00,
  0.25,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DBS5 - LARGE_VAN TRANSPORTADORA
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dbs5_largevan_t_001',
  'LARGE_VAN',
  'TRANSPORTADORA',
  1,
  'DBS5',
  25.00,
  6.25,
  0.00,
  5.50,
  NULL,
  NULL,
  NULL,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DBS5 - HELPER PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dbs5_helper_001',
  'HELPER',
  'PROPRIO',
  1,
  'DBS5',
  10.50,
  0.00,
  0.00,
  2.25,
  14.25,
  NULL,
  2.50,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DBS5 - PASSENGER PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dbs5_passenger_001',
  'PASSENGER',
  'PROPRIO',
  1,
  'DBS5',
  37.00,
  9.25,
  0.00,
  8.00,
  46.50,
  11.75,
  9.25,
  0.25,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- ==========================================
-- 5. TABELAS DE PREÇOS - DGO2 (Hidrolândia)
-- ==========================================

-- DGO2 - BIKE PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dgo2_bike_001',
  'BIKE',
  'PROPRIO',
  1,
  'DGO2',
  25.50,
  6.50,
  0.00,
  5.50,
  33.50,
  8.50,
  6.25,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DGO2 - CARGO_VAN PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dgo2_cargovan_p_001',
  'CARGO_VAN',
  'PROPRIO',
  1,
  'DGO2',
  37.00,
  9.25,
  0.64,
  8.00,
  46.50,
  11.75,
  9.25,
  0.25,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DGO2 - CARGO_VAN TRANSPORTADORA
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dgo2_cargovan_t_001',
  'CARGO_VAN',
  'TRANSPORTADORA',
  1,
  'DGO2',
  21.00,
  5.25,
  0.00,
  4.50,
  NULL,
  NULL,
  NULL,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DGO2 - LARGE_VAN PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dgo2_largevan_p_001',
  'LARGE_VAN',
  'PROPRIO',
  1,
  'DGO2',
  48.50,
  12.25,
  0.64,
  10.50,
  59.75,
  15.00,
  12.25,
  0.25,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DGO2 - LARGE_VAN TRANSPORTADORA
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dgo2_largevan_t_001',
  'LARGE_VAN',
  'TRANSPORTADORA',
  1,
  'DGO2',
  21.00,
  5.25,
  0.00,
  4.50,
  NULL,
  NULL,
  NULL,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DGO2 - HELPER PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dgo2_helper_001',
  'HELPER',
  'PROPRIO',
  1,
  'DGO2',
  9.50,
  0.00,
  0.00,
  2.00,
  13.00,
  NULL,
  2.25,
  NULL,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- DGO2 - PASSENGER PROPRIO
INSERT INTO tabelas_precos (
  id, tipoServico, propriedade, versao, estacao,
  valorHora, valorCancelamento, valorKm, bonusWeekend,
  valorHoraDSP, valorCancelamentoDSP, bonusWeekendDSP, valorPorPacote,
  dataInicioVigencia, dataFimVigencia, ativo, criadoPor, createdAt, updatedAt
)
VALUES (
  'preco_dgo2_passenger_001',
  'PASSENGER',
  'PROPRIO',
  1,
  'DGO2',
  34.00,
  8.50,
  0.00,
  7.25,
  42.50,
  10.75,
  8.50,
  0.25,
  '2025-09-26',
  NULL,
  true,
  'admin_temelio_001',
  NOW(),
  NOW()
);

-- ==========================================
-- FIM DO SCRIPT
-- ==========================================

-- Resumo dos dados inseridos:
-- - 2 Usuários (1 admin + 1 motorista)
-- - 1 Motorista completo (com documento e contrato)
-- - 3 Locais (DBS5, DGO2, TAG001)
-- - 14 Tabelas de Preços (7 DBS5 + 7 DGO2)
--
-- Credenciais de acesso:
-- Admin: admin@temelio.com.br / temelio123
-- Motorista: motorista@temelio.com.br / temelio123
