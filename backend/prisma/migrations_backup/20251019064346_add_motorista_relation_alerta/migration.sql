-- AddForeignKey
ALTER TABLE `alertas` ADD CONSTRAINT `alertas_motoristaId_fkey` FOREIGN KEY (`motoristaId`) REFERENCES `motoristas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
