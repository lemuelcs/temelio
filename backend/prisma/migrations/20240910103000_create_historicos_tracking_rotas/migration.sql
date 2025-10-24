-- Cria a tabela de histórico de tracking de rotas caso ainda não exista
CREATE TABLE IF NOT EXISTS `historicos_tracking_rotas` (
    `id` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `rotaId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `motoristaId` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `status` ENUM('AGUARDANDO', 'A_CAMINHO', 'NO_LOCAL', 'ROTA_INICIADA', 'ROTA_CONCLUIDA') NOT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `dispositivo` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `historicos_tracking_rotas_rotaId_status_idx` (`rotaId`, `status`),
    INDEX `historicos_tracking_rotas_motoristaId_idx` (`motoristaId`),
    CONSTRAINT `historicos_tracking_rotas_rotaId_fkey`
        FOREIGN KEY (`rotaId`) REFERENCES `rotas`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `historicos_tracking_rotas_motoristaId_fkey`
        FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;
