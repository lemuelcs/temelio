-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `perfil` ENUM('DESPACHANTE_PLANEJADOR', 'MOTORISTA', 'ADMINISTRADOR') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `motoristas` (
    `id` VARCHAR(191) NOT NULL,
    `transporterId` VARCHAR(14) NULL,
    `nomeCompleto` VARCHAR(50) NOT NULL,
    `celular` VARCHAR(11) NOT NULL,
    `cep` VARCHAR(191) NULL,
    `logradouro` VARCHAR(191) NULL,
    `numero` VARCHAR(191) NULL,
    `complemento` VARCHAR(191) NULL,
    `cidade` VARCHAR(30) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `bairro` VARCHAR(50) NULL,
    `cpf` VARCHAR(11) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `chavePix` VARCHAR(60) NULL,
    `tipoVeiculo` ENUM('MOTOCICLETA', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NOT NULL,
    `propriedadeVeiculo` ENUM('PROPRIO', 'TRANSPORTADORA') NOT NULL DEFAULT 'PROPRIO',
    `status` ENUM('ATIVO', 'INATIVO', 'SUSPENSO', 'ONBOARDING', 'EXCLUIDO') NOT NULL DEFAULT 'ATIVO',
    `nivel` ENUM('INICIANTE', 'BRONZE', 'PRATA', 'OURO', 'ELITE') NOT NULL DEFAULT 'INICIANTE',
    `pontuacao` DOUBLE NOT NULL DEFAULT 0,
    `anoFabricacaoVeiculo` INTEGER NULL,
    `placaVeiculo` VARCHAR(7) NULL,
    `primeiraRotaNursery` DATETIME(3) NULL,
    `iniciouNurseryL1` DATETIME(3) NULL,
    `iniciouNurseryL2` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `motoristas_transporterId_key`(`transporterId`),
    UNIQUE INDEX `motoristas_cpf_key`(`cpf`),
    UNIQUE INDEX `motoristas_usuarioId_key`(`usuarioId`),
    INDEX `motoristas_status_idx`(`status`),
    INDEX `motoristas_tipoVeiculo_idx`(`tipoVeiculo`),
    INDEX `motoristas_cpf_idx`(`cpf`),
    INDEX `motoristas_nivel_idx`(`nivel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentos_motoristas` (
    `id` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `numeroCNH` VARCHAR(11) NULL,
    `validadeCNH` DATETIME(3) NULL,
    `anoLicenciamento` INTEGER NULL,
    `dataVerificacaoBRK` DATETIME(3) NULL,
    `proximaVerificacaoBRK` DATETIME(3) NULL,
    `statusBRK` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `documentos_motoristas_validadeCNH_idx`(`validadeCNH`),
    INDEX `documentos_motoristas_proximaVerificacaoBRK_idx`(`proximaVerificacaoBRK`),
    UNIQUE INDEX `documentos_motoristas_motoristaId_key`(`motoristaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contratos_motoristas` (
    `id` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `numeroContrato` VARCHAR(20) NOT NULL,
    `dataAssinatura` DATETIME(3) NOT NULL,
    `dataVigenciaInicial` DATETIME(3) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `cnpjMEI` VARCHAR(14) NULL,
    `razaoSocialMEI` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contratos_motoristas_numeroContrato_key`(`numeroContrato`),
    INDEX `contratos_motoristas_motoristaId_idx`(`motoristaId`),
    INDEX `contratos_motoristas_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_status_motoristas` (
    `id` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `statusAnterior` ENUM('ATIVO', 'INATIVO', 'SUSPENSO', 'ONBOARDING', 'EXCLUIDO') NOT NULL,
    `statusNovo` ENUM('ATIVO', 'INATIVO', 'SUSPENSO', 'ONBOARDING', 'EXCLUIDO') NOT NULL,
    `motivo` TEXT NULL,
    `alteradoPor` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historico_status_motoristas_motoristaId_createdAt_idx`(`motoristaId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disponibilidades` (
    `id` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `data` DATE NOT NULL,
    `turno` ENUM('MATUTINO', 'VESPERTINO', 'NOTURNO') NOT NULL,
    `disponivel` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `disponibilidades_motoristaId_data_idx`(`motoristaId`, `data`),
    UNIQUE INDEX `disponibilidades_motoristaId_data_turno_key`(`motoristaId`, `data`, `turno`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_disponibilidades` (
    `id` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `data` DATE NOT NULL,
    `turno` ENUM('MATUTINO', 'VESPERTINO', 'NOTURNO') NOT NULL,
    `disponivel` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historico_disponibilidades_motoristaId_data_idx`(`motoristaId`, `data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locais` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(10) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `endereco` VARCHAR(200) NOT NULL,
    `cidade` VARCHAR(50) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `cep` VARCHAR(8) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locais_codigo_key`(`codigo`),
    INDEX `locais_codigo_idx`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tabelas_precos` (
    `id` VARCHAR(191) NOT NULL,
    `nomeTabela` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `estacao` VARCHAR(191) NOT NULL,
    `localId` VARCHAR(191) NOT NULL,
    `tipoVeiculo` ENUM('MOTOCICLETA', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NOT NULL,
    `propriedadeVeiculo` ENUM('PROPRIO', 'TRANSPORTADORA') NOT NULL,
    `tipoServico` ENUM('BIKE', 'SMALL_VAN', 'LARGE_VAN', 'HELPER', 'PASSENGER') NOT NULL,
    `propriedade` ENUM('PROPRIO', 'TRANSPORTADORA') NOT NULL,
    `valorHora` DECIMAL(10, 2) NOT NULL,
    `valorKm` DECIMAL(10, 2) NOT NULL,
    `valorCancelamento` DECIMAL(10, 2) NOT NULL,
    `bonusWeekend` DECIMAL(10, 2) NOT NULL,
    `valorHoraDSP` DECIMAL(10, 2) NULL,
    `valorCancelamentoDSP` DECIMAL(10, 2) NULL,
    `bonusWeekendDSP` DECIMAL(10, 2) NULL,
    `valorPorPacote` DECIMAL(10, 2) NULL,
    `dataInicioVigencia` DATETIME(3) NOT NULL,
    `dataFimVigencia` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `criadoPor` VARCHAR(191) NULL,

    INDEX `tabelas_precos_tipoVeiculo_propriedadeVeiculo_ativo_idx`(`tipoVeiculo`, `propriedadeVeiculo`, `ativo`),
    INDEX `tabelas_precos_tipoServico_propriedade_ativo_idx`(`tipoServico`, `propriedade`, `ativo`),
    INDEX `tabelas_precos_estacao_ativo_dataInicioVigencia_idx`(`estacao`, `ativo`, `dataInicioVigencia`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rotas` (
    `id` VARCHAR(191) NOT NULL,
    `dataRota` DATE NOT NULL,
    `horaInicio` TIME(0) NOT NULL,
    `horaFim` TIME(0) NULL,
    `tipoVeiculo` ENUM('MOTOCICLETA', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NOT NULL,
    `tipoRota` ENUM('ENTREGA', 'EXTRA', 'CUBOUT', 'RESGATE', 'NURSERY_LEVEL_1', 'NURSERY_LEVEL_2') NOT NULL DEFAULT 'ENTREGA',
    `cicloRota` ENUM('CICLO_1', 'CICLO_2', 'SAMEDAY', 'SEM_CICLO') NOT NULL DEFAULT 'SEM_CICLO',
    `tamanhoHoras` DECIMAL(4, 2) NOT NULL,
    `veiculoTransportadora` BOOLEAN NOT NULL DEFAULT false,
    `valorHora` DECIMAL(10, 2) NOT NULL,
    `bonusPorHora` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `bonusFixo` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valorProjetado` DECIMAL(10, 2) NOT NULL,
    `kmProjetado` INTEGER NULL DEFAULT 50,
    `tabelaPrecosId` VARCHAR(191) NULL,
    `valorHoraSnapshot` DECIMAL(10, 2) NULL,
    `valorKmSnapshot` DECIMAL(10, 2) NULL,
    `valorCancelSnapshot` DECIMAL(10, 2) NULL,
    `bonusWeekendSnapshot` DECIMAL(10, 2) NULL,
    `latitudeOrigem` DECIMAL(10, 8) NULL,
    `longitudeOrigem` DECIMAL(11, 8) NULL,
    `codigoRota` VARCHAR(191) NULL,
    `qtdePacotes` INTEGER NULL,
    `qtdeLocais` INTEGER NULL,
    `qtdeParadas` INTEGER NULL,
    `horaInicioReal` DATETIME(3) NULL,
    `horaFimReal` DATETIME(3) NULL,
    `kmReal` DECIMAL(10, 2) NULL,
    `bonusPorKm` DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
    `valorBonusKm` DECIMAL(10, 2) NULL,
    `valorTotalRota` DECIMAL(10, 2) NOT NULL,
    `dataValidacao` DATETIME(3) NULL,
    `validadoPor` VARCHAR(191) NULL,
    `status` ENUM('DISPONIVEL', 'OFERTADA', 'ACEITA', 'RECUSADA', 'CANCELADA', 'CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'VALIDADA') NOT NULL DEFAULT 'DISPONIVEL',
    `localId` VARCHAR(191) NOT NULL,
    `motivoCancelamento` TEXT NULL,
    `dataCancelamento` DATETIME(3) NULL,
    `valorCancelamento` DECIMAL(10, 2) NULL,
    `motoristaId` VARCHAR(191) NULL,
    `criadoPor` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rotas_codigoRota_key`(`codigoRota`),
    INDEX `rotas_dataRota_status_idx`(`dataRota`, `status`),
    INDEX `rotas_status_idx`(`status`),
    INDEX `rotas_tipoVeiculo_idx`(`tipoVeiculo`),
    INDEX `rotas_codigoRota_idx`(`codigoRota`),
    INDEX `rotas_tabelaPrecosId_idx`(`tabelaPrecosId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `ofertas_rotas` (
    `id` VARCHAR(191) NOT NULL,
    `rotaId` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA') NOT NULL DEFAULT 'PENDENTE',
    `dataEnvio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataVisualizacao` DATETIME(3) NULL,
    `dataResposta` DATETIME(3) NULL,
    `ipResposta` VARCHAR(45) NULL,
    `dispositivoResposta` VARCHAR(100) NULL,
    `latitudeResposta` DECIMAL(10, 8) NULL,
    `longitudeResposta` DECIMAL(11, 8) NULL,
    `adicionouAgenda` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ofertas_rotas_motoristaId_status_idx`(`motoristaId`, `status`),
    INDEX `ofertas_rotas_rotaId_idx`(`rotaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faturamentos` (
    `id` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `quinzena` INTEGER NOT NULL,
    `mes` INTEGER NOT NULL,
    `ano` INTEGER NOT NULL,
    `valorRotas` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valorBonus` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valorAjudaCombustivel` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valorCancelamentos` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valorTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `pago` BOOLEAN NOT NULL DEFAULT false,
    `dataPagamento` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `faturamentos_motoristaId_idx`(`motoristaId`),
    UNIQUE INDEX `faturamentos_motoristaId_quinzena_mes_ano_key`(`motoristaId`, `quinzena`, `mes`, `ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `metricas_entregas` (
    `id` VARCHAR(191) NOT NULL,
    `rotaId` VARCHAR(191) NOT NULL,
    `motoristaId` VARCHAR(191) NOT NULL,
    `data` DATE NOT NULL,
    `totalPacotes` INTEGER NOT NULL,
    `pacotesEntregues` INTEGER NOT NULL,
    `pacotesRetornados` INTEGER NOT NULL,
    `pacotesPNOV` INTEGER NOT NULL,
    `pacotesDNR` INTEGER NOT NULL,
    `taxaDRC` DECIMAL(5, 2) NOT NULL,
    `horarioCarregamento` TIME(0) NOT NULL,
    `horarioChegada` DATETIME(3) NULL,
    `atrasouCarregamento` BOOLEAN NOT NULL DEFAULT false,
    `minutosAtraso` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `metricas_entregas_data_idx`(`data`),
    INDEX `metricas_entregas_motoristaId_idx`(`motoristaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(100) NOT NULL,
    `entidade` VARCHAR(50) NOT NULL,
    `entidadeId` VARCHAR(191) NULL,
    `descricao` TEXT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `dispositivo` VARCHAR(500) NOT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_usuarioId_createdAt_idx`(`usuarioId`, `createdAt`),
    INDEX `audit_logs_entidade_entidadeId_idx`(`entidade`, `entidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alertas` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(50) NOT NULL,
    `motoristaId` VARCHAR(191) NULL,
    `titulo` VARCHAR(100) NOT NULL,
    `descricao` TEXT NOT NULL,
    `severidade` VARCHAR(20) NOT NULL,
    `resolvido` BOOLEAN NOT NULL DEFAULT false,
    `dataResolucao` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `alertas_motoristaId_resolvido_idx`(`motoristaId`, `resolvido`),
    INDEX `alertas_tipo_resolvido_idx`(`tipo`, `resolvido`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `motoristas` ADD CONSTRAINT `motoristas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos_motoristas` ADD CONSTRAINT `documentos_motoristas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contratos_motoristas` ADD CONSTRAINT `contratos_motoristas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_status_motoristas` ADD CONSTRAINT `historico_status_motoristas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_status_motoristas` ADD CONSTRAINT `historico_status_motoristas_alteradoPor_fkey` FOREIGN KEY (`alteradoPor`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disponibilidades` ADD CONSTRAINT `disponibilidades_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_disponibilidades` ADD CONSTRAINT `historico_disponibilidades_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tabelas_precos` ADD CONSTRAINT `tabelas_precos_localId_fkey` FOREIGN KEY (`localId`) REFERENCES `locais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotas` ADD CONSTRAINT `rotas_tabelaPrecosId_fkey` FOREIGN KEY (`tabelaPrecosId`) REFERENCES `tabelas_precos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotas` ADD CONSTRAINT `rotas_localId_fkey` FOREIGN KEY (`localId`) REFERENCES `locais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotas` ADD CONSTRAINT `rotas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotas_atribuicoes` ADD CONSTRAINT `rotas_atribuicoes_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ofertas_rotas` ADD CONSTRAINT `ofertas_rotas_rotaId_fkey` FOREIGN KEY (`rotaId`) REFERENCES `rotas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ofertas_rotas` ADD CONSTRAINT `ofertas_rotas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faturamentos` ADD CONSTRAINT `faturamentos_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alertas` ADD CONSTRAINT `alertas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

