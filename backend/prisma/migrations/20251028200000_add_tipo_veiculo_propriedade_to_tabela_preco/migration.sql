-- AlterTable
ALTER TABLE `tabelas_precos` ADD COLUMN `tipoVeiculo` ENUM('MOTOCICLETA', 'CARRO_PASSEIO', 'CARGO_VAN', 'LARGE_VAN') NULL,
    ADD COLUMN `propriedadeVeiculo` ENUM('PROPRIO', 'TRANSPORTADORA') NULL;

-- CreateIndex
CREATE INDEX `tabelas_precos_tipoVeiculo_propriedadeVeiculo_ativo_idx` ON `tabelas_precos`(`tipoVeiculo`, `propriedadeVeiculo`, `ativo`);
