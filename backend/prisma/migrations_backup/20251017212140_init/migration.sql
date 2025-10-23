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
    `transporterId` VARCHAR(14) NOT NULL,
    `nomeCompleto` VARCHAR(50) NOT NULL,
    `celular` VARCHAR(11) NOT NULL,
    `cidade` VARCHAR(30) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `bairro` VARCHAR(50) NOT NULL,
    `cpf` VARCHAR(11) NOT NULL,
    `email` VARCHAR(50) NOT NULL,
    `tipoVeiculo` ENUM('MOTOCICLETA', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NOT NULL,
    `propriedadeVeiculo` ENUM('PROPRIO', 'TRANSPORTADORA') NOT NULL DEFAULT 'PROPRIO',
    `status` ENUM('ATIVO', 'INATIVO', 'SUSPENSO', 'EXCLUIDO') NOT NULL DEFAULT 'ATIVO',
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
CREATE TABLE `locais` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(10) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `endereco` TEXT NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `cidade` VARCHAR(50) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `locais_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tabelas_precos` (
    `id` VARCHAR(191) NOT NULL,
    `tipoVeiculo` ENUM('MOTO', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NOT NULL,
    `propriedadeVeiculo` ENUM('PROPRIO', 'TRANSPORTADORA') NOT NULL,
    `valorHora` DECIMAL(10, 2) NOT NULL,
    `valorCancelamentoHora` DECIMAL(10, 2) NOT NULL,
    `valorAjudaCombustivel` DECIMAL(10, 2) NOT NULL,
    `dataInicioVigencia` DATETIME(3) NOT NULL,
    `dataFimVigencia` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tabelas_precos_tipoVeiculo_propriedadeVeiculo_ativo_idx`(`tipoVeiculo`, `propriedadeVeiculo`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rotas` (
    `id` VARCHAR(191) NOT NULL,
    `data` DATE NOT NULL,
    `horarioCarregamento` TIME(0) NOT NULL,
    `tipoVeiculo` ENUM('MOTO', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NOT NULL,
    `tipoRota` ENUM('REGULAR', 'EXTRA', 'CUBOUT', 'RESGATE', 'NURSERY_LEVEL_1', 'NURSERY_LEVEL_2') NOT NULL,
    `ciclo` ENUM('CICLO_1', 'CICLO_2', 'SAMEDAY', 'SEM_CICLO') NOT NULL,
    `tamanhoHoras` INTEGER NOT NULL,
    `localId` VARCHAR(191) NOT NULL,
    `valorHora` DECIMAL(10, 2) NOT NULL,
    `valorRota` DECIMAL(10, 2) NOT NULL,
    `valorBonusHora` DECIMAL(10, 2) NULL,
    `valorBonusFixo` DECIMAL(10, 2) NULL,
    `tipoBonusRota` ENUM('POR_HORA', 'VALOR_FIXO') NULL,
    `valorAjudaCombustivel` DECIMAL(10, 2) NULL,
    `kmProjetadoMin` INTEGER NULL DEFAULT 50,
    `kmProjetadoMax` INTEGER NULL DEFAULT 80,
    `status` ENUM('DISPONIVEL', 'ALOCADA', 'ACEITA', 'RECUSADA', 'CANCELADA', 'CONCLUIDA') NOT NULL DEFAULT 'DISPONIVEL',
    `criadoPor` VARCHAR(191) NOT NULL,
    `motivoCancelamento` TEXT NULL,
    `dataCancelamento` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rotas_data_status_idx`(`data`, `status`),
    INDEX `rotas_tipoVeiculo_idx`(`tipoVeiculo`),
    INDEX `rotas_status_idx`(`status`),
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
    `dispositivo` VARCHAR(100) NOT NULL,
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
ALTER TABLE `disponibilidades` ADD CONSTRAINT `disponibilidades_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotas` ADD CONSTRAINT `rotas_localId_fkey` FOREIGN KEY (`localId`) REFERENCES `locais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ofertas_rotas` ADD CONSTRAINT `ofertas_rotas_rotaId_fkey` FOREIGN KEY (`rotaId`) REFERENCES `rotas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ofertas_rotas` ADD CONSTRAINT `ofertas_rotas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `faturamentos` ADD CONSTRAINT `faturamentos_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
