/*
  Warnings:

  - You are about to drop the column `turno` on the `disponibilidades` table. All the data in the column will be lost.
  - You are about to drop the column `disponivel` on the `historico_disponibilidades` table. All the data in the column will be lost.
  - You are about to drop the column `turno` on the `historico_disponibilidades` table. All the data in the column will be lost.
  - You are about to alter the column `nivel` on the `motoristas` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(20))` to `VarChar(45)`.
  - You are about to drop the column `bonusPorKm` on the `rotas` table. All the data in the column will be lost.
  - You are about to alter the column `cicloRota` on the `rotas` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(12))` to `Enum(EnumId(10))`.
  - You are about to drop the column `descricao` on the `tabelas_precos` table. All the data in the column will be lost.
  - You are about to drop the column `localId` on the `tabelas_precos` table. All the data in the column will be lost.
  - You are about to drop the column `nomeTabela` on the `tabelas_precos` table. All the data in the column will be lost.
  - You are about to alter the column `estacao` on the `tabelas_precos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - You are about to alter the column `tipoServico` on the `tabelas_precos` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(15))` to `Enum(EnumId(17))`.
  - You are about to drop the `rotas_atribuicoes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[motoristaId,data,ciclo]` on the table `disponibilidades` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rotaId]` on the table `metricas_entregas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ciclo` to the `disponibilidades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ciclo` to the `historico_disponibilidades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disponivelAntigo` to the `historico_disponibilidades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disponivelNovo` to the `historico_disponibilidades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `disponibilidades` DROP FOREIGN KEY `disponibilidades_motoristaId_fkey`;

-- DropForeignKey
ALTER TABLE `historico_disponibilidades` DROP FOREIGN KEY `historico_disponibilidades_motoristaId_fkey`;

-- DropForeignKey
ALTER TABLE `historicos_tracking_rotas` DROP FOREIGN KEY `historicos_tracking_rotas_motoristaId_fkey`;

-- DropForeignKey
ALTER TABLE `historicos_tracking_rotas` DROP FOREIGN KEY `historicos_tracking_rotas_rotaId_fkey`;

-- DropForeignKey
ALTER TABLE `rotas_atribuicoes` DROP FOREIGN KEY `rotas_atribuicoes_motoristaId_fkey`;

-- DropForeignKey
ALTER TABLE `tabelas_precos` DROP FOREIGN KEY `tabelas_precos_localId_fkey`;

-- DropIndex
DROP INDEX `disponibilidades_motoristaId_data_turno_key` ON `disponibilidades`;

-- DropIndex
DROP INDEX `locais_codigo_idx` ON `locais`;

-- DropIndex
DROP INDEX `motoristas_nivel_idx` ON `motoristas`;

-- DropIndex
DROP INDEX `tabelas_precos_localId_fkey` ON `tabelas_precos`;

-- AlterTable
ALTER TABLE `disponibilidades` DROP COLUMN `turno`,
    ADD COLUMN `ciclo` ENUM('CICLO_1', 'CICLO_2', 'SAME_DAY') NOT NULL;

-- AlterTable
ALTER TABLE `historico_disponibilidades` DROP COLUMN `disponivel`,
    DROP COLUMN `turno`,
    ADD COLUMN `alteradoPor` VARCHAR(191) NULL,
    ADD COLUMN `ciclo` ENUM('CICLO_1', 'CICLO_2', 'SAME_DAY') NOT NULL,
    ADD COLUMN `disponivelAntigo` BOOLEAN NOT NULL,
    ADD COLUMN `disponivelNovo` BOOLEAN NOT NULL,
    ADD COLUMN `motivoAlteracao` TEXT NULL;

-- AlterTable
ALTER TABLE `locais` ADD COLUMN `bairro` VARCHAR(30) NULL,
    MODIFY `endereco` TEXT NOT NULL,
    MODIFY `cep` VARCHAR(8) NULL,
    MODIFY `latitude` DECIMAL(10, 8) NULL,
    MODIFY `longitude` DECIMAL(11, 8) NULL;

-- AlterTable
ALTER TABLE `metricas_entregas` ADD COLUMN `duracaoEmMinutos` INTEGER NULL,
    ADD COLUMN `feedbackMotorista` TEXT NULL,
    ADD COLUMN `horaFimRota` DATETIME(3) NULL,
    ADD COLUMN `horaInicioRota` DATETIME(3) NULL,
    ADD COLUMN `satisfacaoMotorista` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `motoristas` ADD COLUMN `dataNascimento` DATETIME(3) NULL,
    MODIFY `nivel` VARCHAR(45) NULL DEFAULT 'INICIANTE';

-- AlterTable
ALTER TABLE `ofertas_rotas` ADD COLUMN `motivoRecusa` TEXT NULL;

-- AlterTable
ALTER TABLE `rotas` DROP COLUMN `bonusPorKm`,
    ADD COLUMN `statusTracking` ENUM('AGUARDANDO', 'A_CAMINHO', 'NO_LOCAL', 'ROTA_INICIADA', 'ROTA_CONCLUIDA') NOT NULL DEFAULT 'AGUARDANDO',
    ADD COLUMN `timestampACaminho` DATETIME(3) NULL,
    ADD COLUMN `timestampNoLocal` DATETIME(3) NULL,
    ADD COLUMN `timestampRotaConcluida` DATETIME(3) NULL,
    ADD COLUMN `timestampRotaIniciada` DATETIME(3) NULL,
    ADD COLUMN `valorKm` DECIMAL(10, 2) NOT NULL DEFAULT 0.64,
    MODIFY `cicloRota` ENUM('CICLO_1', 'CICLO_2', 'SAME_DAY') NOT NULL DEFAULT 'CICLO_1';

-- AlterTable
ALTER TABLE `tabelas_precos` DROP COLUMN `descricao`,
    DROP COLUMN `localId`,
    DROP COLUMN `nomeTabela`,
    ADD COLUMN `versao` INTEGER NOT NULL DEFAULT 1,
    MODIFY `estacao` VARCHAR(10) NOT NULL DEFAULT 'DBS5',
    MODIFY `tipoVeiculo` ENUM('MOTOCICLETA', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NULL,
    MODIFY `propriedadeVeiculo` ENUM('PROPRIO', 'TRANSPORTADORA') NULL,
    MODIFY `tipoServico` ENUM('BIKE', 'CARGO_VAN', 'LARGE_VAN', 'HELPER', 'PASSENGER') NULL,
    MODIFY `propriedade` ENUM('PROPRIO', 'TRANSPORTADORA') NULL,
    MODIFY `bonusWeekend` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- DropTable
DROP TABLE `rotas_atribuicoes`;

-- CreateIndex
CREATE UNIQUE INDEX `disponibilidades_motoristaId_data_ciclo_key` ON `disponibilidades`(`motoristaId`, `data`, `ciclo`);

-- CreateIndex
CREATE INDEX `historico_disponibilidades_createdAt_idx` ON `historico_disponibilidades`(`createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `metricas_entregas_rotaId_key` ON `metricas_entregas`(`rotaId`);

-- AddForeignKey
ALTER TABLE `disponibilidades` ADD CONSTRAINT `disponibilidades_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_disponibilidades` ADD CONSTRAINT `historico_disponibilidades_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historicos_tracking_rotas` ADD CONSTRAINT `historicos_tracking_rotas_rotaId_fkey` FOREIGN KEY (`rotaId`) REFERENCES `rotas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historicos_tracking_rotas` ADD CONSTRAINT `historicos_tracking_rotas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metricas_entregas` ADD CONSTRAINT `metricas_entregas_rotaId_fkey` FOREIGN KEY (`rotaId`) REFERENCES `rotas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `metricas_entregas` ADD CONSTRAINT `metricas_entregas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `historico_status_motoristas` RENAME INDEX `historico_status_motoristas_alteradoPor_fkey` TO `historico_status_motoristas_alteradoPor_idx`;

-- RenameIndex
ALTER TABLE `rotas` RENAME INDEX `rotas_localId_fkey` TO `rotas_localId_idx`;

-- RenameIndex
ALTER TABLE `rotas` RENAME INDEX `rotas_motoristaId_fkey` TO `rotas_motoristaId_idx`;
