import { PrismaClient, TipoServico, TipoPropriedade } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // ==========================================
  // 1. USUÁRIOS
  // ==========================================
  console.log('👤 Criando usuários...');

  const senhaHash = await bcrypt.hash('123456', 10);

  // Usuário Administrador
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@temelio.com.br' },
    update: {},
    create: {
      email: 'admin@temelio.com.br',
      senha: senhaHash,
      nome: 'Administrador Sistema',
      perfil: 'ADMINISTRADOR',
      ativo: true
    }
  });

  // Usuário Despachante/Planejador
  const planejadorUser = await prisma.usuario.upsert({
    where: { email: 'planejador@temelio.com.br' },
    update: {},
    create: {
      email: 'planejador@temelio.com.br',
      senha: senhaHash,
      nome: 'João Planejador',
      perfil: 'DESPACHANTE_PLANEJADOR',
      ativo: true
    }
  });

  console.log(`✅ ${2} usuários criados`);

  // ==========================================
  // 2. TABELAS DE PREÇOS - RATE CARD AMAZON
  // ==========================================
  console.log('💰 Criando tabelas de preços (Rate Card Amazon)...');

  // Data de vigência: 26/09/2025 (conforme Rate Card)
  const dataVigencia = new Date('2025-09-26');

  // ========== DBS5 - BRASÍLIA ==========
  const precosDBS5 = [
    {
      tipoServico: TipoServico.BIKE,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 27.00,
      valorCancelamentoHora: 6.75,
      bonusWeekend: 5.75,
      valorAjudaCombustivel: 0.00,
      valorHoraDSP: 35.25,
      valorCancelamentoDSP: 8.75,
      bonusWeekendDSP: 6.75,
    },
    {
      tipoServico: TipoServico.SMALL_VAN,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 40.00,
      valorCancelamentoHora: 10.00,
      bonusWeekend: 8.50,
      valorAjudaCombustivel: 0.64,
      valorHoraDSP: 50.00,
      valorCancelamentoDSP: 12.50,
      bonusWeekendDSP: 9.75,
      valorPorPacote: 0.25,
    },
    {
      tipoServico: TipoServico.SMALL_VAN,
      propriedade: TipoPropriedade.TRANSPORTADORA,
      valorHora: 25.00,
      valorCancelamentoHora: 6.25,
      bonusWeekend: 5.50,
      valorAjudaCombustivel: 0.00,
    },
    {
      tipoServico: TipoServico.LARGE_VAN,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 52.50,
      valorCancelamentoHora: 13.25,
      bonusWeekend: 11.25,
      valorAjudaCombustivel: 0.64,
      valorHoraDSP: 64.25,
      valorCancelamentoDSP: 16.00,
      bonusWeekendDSP: 13.00,
      valorPorPacote: 0.25,
    },
    {
      tipoServico: TipoServico.LARGE_VAN,
      propriedade: TipoPropriedade.TRANSPORTADORA,
      valorHora: 25.00,
      valorCancelamentoHora: 6.25,
      bonusWeekend: 5.50,
      valorAjudaCombustivel: 0.00,
    },
    {
      tipoServico: TipoServico.HELPER,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 10.50,
      valorCancelamentoHora: 0.00,
      bonusWeekend: 2.25,
      valorAjudaCombustivel: 0.00,
      valorHoraDSP: 14.25,
      bonusWeekendDSP: 2.50,
    },
    {
      tipoServico: TipoServico.PASSENGER,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 37.00,
      valorCancelamentoHora: 9.25,
      bonusWeekend: 8.00,
      valorAjudaCombustivel: 0.00,
      valorHoraDSP: 46.50,
      valorCancelamentoDSP: 11.75,
      bonusWeekendDSP: 9.25,
      valorPorPacote: 0.25,
    },
  ];

  // ========== DGO2 - HIDROLÂNDIA ==========
  const precosDGO2 = [
    {
      tipoServico: TipoServico.BIKE,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 25.50,
      valorCancelamentoHora: 6.50,
      bonusWeekend: 5.50,
      valorAjudaCombustivel: 0.00,
      valorHoraDSP: 33.50,
      valorCancelamentoDSP: 8.50,
      bonusWeekendDSP: 6.25,
    },
    {
      tipoServico: TipoServico.SMALL_VAN,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 37.00,
      valorCancelamentoHora: 9.25,
      bonusWeekend: 8.00,
      valorAjudaCombustivel: 0.64,
      valorHoraDSP: 46.50,
      valorCancelamentoDSP: 11.75,
      bonusWeekendDSP: 9.25,
      valorPorPacote: 0.25,
    },
    {
      tipoServico: TipoServico.SMALL_VAN,
      propriedade: TipoPropriedade.TRANSPORTADORA,
      valorHora: 21.00,
      valorCancelamentoHora: 5.25,
      bonusWeekend: 4.50,
      valorAjudaCombustivel: 0.00,
    },
    {
      tipoServico: TipoServico.LARGE_VAN,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 48.50,
      valorCancelamentoHora: 12.25,
      bonusWeekend: 10.50,
      valorAjudaCombustivel: 0.64,
      valorHoraDSP: 59.75,
      valorCancelamentoDSP: 15.00,
      bonusWeekendDSP: 12.25,
      valorPorPacote: 0.25,
    },
    {
      tipoServico: TipoServico.LARGE_VAN,
      propriedade: TipoPropriedade.TRANSPORTADORA,
      valorHora: 21.00,
      valorCancelamentoHora: 5.25,
      bonusWeekend: 4.50,
      valorAjudaCombustivel: 0.00,
    },
    {
      tipoServico: TipoServico.HELPER,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 9.50,
      valorCancelamentoHora: 0.00,
      bonusWeekend: 2.00,
      valorAjudaCombustivel: 0.00,
      valorHoraDSP: 13.00,
      bonusWeekendDSP: 2.25,
    },
    {
      tipoServico: TipoServico.PASSENGER,
      propriedade: TipoPropriedade.PROPRIO,
      valorHora: 34.00,
      valorCancelamentoHora: 8.50,
      bonusWeekend: 7.25,
      valorAjudaCombustivel: 0.00,
      valorHoraDSP: 42.50,
      valorCancelamentoDSP: 10.75,
      bonusWeekendDSP: 8.50,
      valorPorPacote: 0.25,
    },
  ];

  let countPrecos = 0;

  // Inserir DBS5
  for (const preco of precosDBS5) {
    await prisma.tabelaPreco.create({
      data: {
        versao: 1,
        estacao: 'DBS5',
        tipoServico: preco.tipoServico,
        propriedade: preco.propriedade,
        valorHora: preco.valorHora,
        valorCancelamentoHora: preco.valorCancelamentoHora,
        bonusWeekend: preco.bonusWeekend,
        valorAjudaCombustivel: preco.valorAjudaCombustivel,
        valorHoraDSP: preco.valorHoraDSP,
        valorCancelamentoDSP: preco.valorCancelamentoDSP,
        bonusWeekendDSP: preco.bonusWeekendDSP,
        valorPorPacote: preco.valorPorPacote,
        dataInicioVigencia: dataVigencia,
        ativo: true,
        criadoPor: adminUser.id,
      },
    });
    countPrecos++;
  }

  // Inserir DGO2
  for (const preco of precosDGO2) {
    await prisma.tabelaPreco.create({
      data: {
        versao: 1,
        estacao: 'DGO2',
        tipoServico: preco.tipoServico,
        propriedade: preco.propriedade,
        valorHora: preco.valorHora,
        valorCancelamentoHora: preco.valorCancelamentoHora,
        bonusWeekend: preco.bonusWeekend,
        valorAjudaCombustivel: preco.valorAjudaCombustivel,
        valorHoraDSP: preco.valorHoraDSP,
        valorCancelamentoDSP: preco.valorCancelamentoDSP,
        bonusWeekendDSP: preco.bonusWeekendDSP,
        valorPorPacote: preco.valorPorPacote,
        dataInicioVigencia: dataVigencia,
        ativo: true,
        criadoPor: adminUser.id,
      },
    });
    countPrecos++;
  }

  console.log(`✅ ${countPrecos} tabelas de preços criadas (${precosDBS5.length} DBS5 + ${precosDGO2.length} DGO2)`);

  // ==========================================
  // 3. LOCAIS/ESTAÇÕES
  // ==========================================
  console.log('📍 Criando locais...');

  const localBSB = await prisma.local.upsert({
    where: { codigo: 'DBS5' },
    update: {},
    create: {
      codigo: 'DBS5',
      nome: 'Centro de Distribuição Brasília (DBS5)',
      endereco: 'SAAN Quadra 1 Conjunto A, Brasília - DF',
      cidade: 'Brasília',
      bairro: 'Asa Norte',
      uf: 'DF',
      latitude: -15.7942,
      longitude: -47.8825,
      ativo: true
    }
  });

  const localGOI = await prisma.local.upsert({
    where: { codigo: 'DGO2' },
    update: {},
    create: {
      codigo: 'DGO2',
      nome: 'Hub Hidrolândia (DGO2)',
      endereco: 'Rodovia GO-010, Hidrolândia - GO',
      cidade: 'Hidrolândia',
      bairro: 'Zona Industrial',
      uf: 'GO',
      latitude: -16.9619,
      longitude: -49.2297,
      ativo: true
    }
  });

  const localTAG = await prisma.local.upsert({
    where: { codigo: 'TAG001' },
    update: {},
    create: {
      codigo: 'TAG001',
      nome: 'Estação Taguatinga',
      endereco: 'QNM 40, Taguatinga - DF',
      cidade: 'Taguatinga',
      bairro: 'Taguatinga Norte',
      uf: 'DF',
      latitude: -15.8267,
      longitude: -48.0553,
      ativo: true
    }
  });

  console.log(`✅ ${3} locais criados`);

  // ==========================================
  // 4. MOTORISTAS
  // ==========================================
  console.log('🚗 Criando motoristas...');

  // Motorista 1 - Van Cargo
  const motorista1User = await prisma.usuario.upsert({
    where: { email: 'joao.silva@email.com' },
    update: {},
    create: {
      email: 'joao.silva@email.com',
      senha: senhaHash,
      nome: 'João Silva',
      perfil: 'MOTORISTA',
      ativo: true
    }
  });

  const motorista1 = await prisma.motorista.upsert({
    where: { cpf: '12345678901' },
    update: {},
    create: {
      usuarioId: motorista1User.id,
      transporterId: '12345678000199',
      nomeCompleto: 'João Silva Santos',
      cpf: '12345678901',
      email: 'joao.silva@email.com',
      celular: '61987654321',
      chavePix: '61987654321',
      cidade: 'Brasília',
      uf: 'DF',
      bairro: 'Asa Sul',
      tipoVeiculo: 'CARGO_VAN',
      propriedadeVeiculo: 'PROPRIO',
      status: 'ATIVO',
      placaVeiculo: 'ABC1234',
      anoFabricacaoVeiculo: 2020,
      pontuacao: 4.8
    }
  });

  await prisma.documentoMotorista.upsert({
    where: { motoristaId: motorista1.id },
    update: {},
    create: {
      motoristaId: motorista1.id,
      numeroCNH: '12345678901',
      validadeCNH: new Date('2027-12-31'),
      anoLicenciamento: 2025,
      dataVerificacaoBRK: new Date('2025-01-15'),
      proximaVerificacaoBRK: new Date('2026-01-15'),
      statusBRK: true
    }
  });

  await prisma.contratoMotorista.upsert({
    where: { numeroContrato: 'CONT-2025-001' },
    update: {},
    create: {
      motoristaId: motorista1.id,
      numeroContrato: 'CONT-2025-001',
      dataAssinatura: new Date('2025-01-01'),
      dataVigenciaInicial: new Date('2025-01-01'),
      ativo: true,
      cnpjMEI: '12345678000199',
      razaoSocialMEI: 'JOÃO SILVA SANTOS TRANSPORTES'
    }
  });

  // Motorista 2 - Moto
  const motorista2User = await prisma.usuario.upsert({
    where: { email: 'maria.costa@email.com' },
    update: {},
    create: {
      email: 'maria.costa@email.com',
      senha: senhaHash,
      nome: 'Maria Costa',
      perfil: 'MOTORISTA',
      ativo: true
    }
  });

  const motorista2 = await prisma.motorista.upsert({
    where: { cpf: '98765432109' },
    update: {},
    create: {
      usuarioId: motorista2User.id,
      transporterId: '98765432000188',
      nomeCompleto: 'Maria Costa Oliveira',
      cpf: '98765432109',
      email: 'maria.costa@email.com',
      celular: '61912345678',
      chavePix: '61912345678',
      cidade: 'Brasília',
      uf: 'DF',
      bairro: 'Taguatinga',
      tipoVeiculo: 'MOTOCICLETA',
      propriedadeVeiculo: 'PROPRIO',
      status: 'ATIVO',
      placaVeiculo: 'XYZ9876',
      anoFabricacaoVeiculo: 2022,
      pontuacao: 4.9
    }
  });

  await prisma.documentoMotorista.upsert({
    where: { motoristaId: motorista2.id },
    update: {},
    create: {
      motoristaId: motorista2.id,
      numeroCNH: '98765432109',
      validadeCNH: new Date('2028-06-30'),
      anoLicenciamento: 2025,
      dataVerificacaoBRK: new Date('2025-02-01'),
      proximaVerificacaoBRK: new Date('2026-02-01'),
      statusBRK: true
    }
  });

  await prisma.contratoMotorista.upsert({
    where: { numeroContrato: 'CONT-2025-002' },
    update: {},
    create: {
      motoristaId: motorista2.id,
      numeroContrato: 'CONT-2025-002',
      dataAssinatura: new Date('2025-02-01'),
      dataVigenciaInicial: new Date('2025-02-01'),
      ativo: true,
      cnpjMEI: '98765432000188',
      razaoSocialMEI: 'MARIA COSTA OLIVEIRA MEI'
    }
  });

  // Motorista 3 - Large Van
  const motorista3User = await prisma.usuario.upsert({
    where: { email: 'pedro.santos@email.com' },
    update: {},
    create: {
      email: 'pedro.santos@email.com',
      senha: senhaHash,
      nome: 'Pedro Santos',
      perfil: 'MOTORISTA',
      ativo: true
    }
  });

  const motorista3 = await prisma.motorista.upsert({
    where: { cpf: '11122233344' },
    update: {},
    create: {
      usuarioId: motorista3User.id,
      transporterId: '11122233000177',
      nomeCompleto: 'Pedro Santos Lima',
      cpf: '11122233344',
      email: 'pedro.santos@email.com',
      celular: '61999887766',
      chavePix: '11122233344',
      cidade: 'Hidrolândia',
      uf: 'GO',
      bairro: 'Centro',
      tipoVeiculo: 'LARGE_VAN',
      propriedadeVeiculo: 'PROPRIO',
      status: 'ATIVO',
      placaVeiculo: 'DEF5678',
      anoFabricacaoVeiculo: 2021,
      pontuacao: 4.7
    }
  });

  await prisma.documentoMotorista.upsert({
    where: { motoristaId: motorista3.id },
    update: {},
    create: {
      motoristaId: motorista3.id,
      numeroCNH: '11122233344',
      validadeCNH: new Date('2029-03-31'),
      anoLicenciamento: 2025,
      dataVerificacaoBRK: new Date('2025-01-20'),
      proximaVerificacaoBRK: new Date('2026-01-20'),
      statusBRK: true
    }
  });

  await prisma.contratoMotorista.upsert({
    where: { numeroContrato: 'CONT-2025-003' },
    update: {},
    create: {
      motoristaId: motorista3.id,
      numeroContrato: 'CONT-2025-003',
      dataAssinatura: new Date('2025-01-15'),
      dataVigenciaInicial: new Date('2025-01-15'),
      ativo: true,
      cnpjMEI: '11122233000177',
      razaoSocialMEI: 'PEDRO SANTOS LIMA TRANSPORTES'
    }
  });

  console.log(`✅ ${3} motoristas criados com documentos e contratos`);

  // ==========================================
  // 5. DISPONIBILIDADES (Exemplos)
  // ==========================================
  console.log('📅 Criando disponibilidades...');

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  await prisma.disponibilidade.createMany({
    data: [
      {
        motoristaId: motorista1.id,
        data: amanha,
        turno: 'MATUTINO',
        disponivel: true
      },
      {
        motoristaId: motorista1.id,
        data: amanha,
        turno: 'VESPERTINO',
        disponivel: true
      },
      {
        motoristaId: motorista2.id,
        data: amanha,
        turno: 'MATUTINO',
        disponivel: true
      },
      {
        motoristaId: motorista3.id,
        data: amanha,
        turno: 'MATUTINO',
        disponivel: true
      },
      {
        motoristaId: motorista3.id,
        data: amanha,
        turno: 'VESPERTINO',
        disponivel: false
      }
    ],
    skipDuplicates: true
  });

  console.log(`✅ Disponibilidades criadas`);

  // ==========================================
  // 6. ROTAS DE EXEMPLO (com snapshot de preços)
  // ==========================================
  console.log('🛣️  Criando rotas de exemplo...');

  // Buscar tabela de preços vigente para SMALL_VAN PROPRIO em DBS5
  const tabelaSmallVan = await prisma.tabelaPreco.findFirst({
    where: {
      estacao: 'DBS5',
      tipoServico: TipoServico.SMALL_VAN,
      propriedade: TipoPropriedade.PROPRIO,
      ativo: true
    }
  });

  // Buscar tabela de preços vigente para BIKE PROPRIO em DBS5
  const tabelaBike = await prisma.tabelaPreco.findFirst({
    where: {
      estacao: 'DBS5',
      tipoServico: TipoServico.BIKE,
      propriedade: TipoPropriedade.PROPRIO,
      ativo: true
    }
  });

  // Rota 1 - Disponível (CARGO_VAN)
  if (tabelaSmallVan) {
    const valorHoraRota1 = Number(tabelaSmallVan.valorHora);
    await prisma.rota.upsert({
      where: { id: 'rota-exemplo-1' },
      update: {},
      create: {
        id: 'rota-exemplo-1',
        dataRota: amanha,
        horaInicio: new Date('1970-01-01T08:00:00Z'),
        horaFim: new Date('1970-01-01T16:00:00Z'),
        tipoVeiculo: 'CARGO_VAN',
        tipoRota: 'ENTREGA',
        cicloRota: 'CICLO_1',
        tamanhoHoras: 8,
        veiculoTransportadora: false,
        localId: localBSB.id,
        
        // Valores da tabela vigente com snapshot
        tabelaPrecosId: tabelaSmallVan.id,
        valorHora: valorHoraRota1,
        valorHoraSnapshot: valorHoraRota1,
        valorKmSnapshot: Number(tabelaSmallVan.valorAjudaCombustivel),
        valorCancelSnapshot: Number(tabelaSmallVan.valorCancelamentoHora),
        bonusWeekendSnapshot: Number(tabelaSmallVan.bonusWeekend),
        
        bonusPorHora: 0,
        bonusFixo: 0,
        valorProjetado: valorHoraRota1 * 8,
        valorTotalRota: valorHoraRota1 * 8,
        kmProjetado: 60,
        status: 'DISPONIVEL',
        criadoPor: planejadorUser.id
      }
    });
  }

  // Rota 2 - Aceita (MOTOCICLETA)
  if (tabelaBike) {
    const valorHoraRota2 = Number(tabelaBike.valorHora);
    await prisma.rota.upsert({
      where: { id: 'rota-exemplo-2' },
      update: {},
      create: {
        id: 'rota-exemplo-2',
        dataRota: amanha,
        horaInicio: new Date('1970-01-01T13:00:00Z'),
        horaFim: new Date('1970-01-01T18:00:00Z'),
        tipoVeiculo: 'MOTOCICLETA',
        tipoRota: 'ENTREGA',
        cicloRota: 'CICLO_2',
        tamanhoHoras: 5,
        veiculoTransportadora: false,
        localId: localTAG.id,
        motoristaId: motorista2.id,
        
        // Valores da tabela vigente com snapshot
        tabelaPrecosId: tabelaBike.id,
        valorHora: valorHoraRota2,
        valorHoraSnapshot: valorHoraRota2,
        valorKmSnapshot: Number(tabelaBike.valorAjudaCombustivel),
        valorCancelSnapshot: Number(tabelaBike.valorCancelamentoHora),
        bonusWeekendSnapshot: Number(tabelaBike.bonusWeekend),
        
        bonusPorHora: 2.00,
        bonusFixo: 10.00,
        valorProjetado: valorHoraRota2 * 5 + 10,
        valorTotalRota: valorHoraRota2 * 5 + 10,
        kmProjetado: 45,
        status: 'ACEITA',
        criadoPor: planejadorUser.id
      }
    });
  }

  console.log(`✅ ${2} rotas de exemplo criadas com snapshot de preços`);

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📊 Resumo:');
  console.log('  - Usuários: 5 (1 admin, 1 planejador, 3 motoristas)');
  console.log(`  - Tabelas de Preços: ${countPrecos} (Rate Card Amazon - DBS5 e DGO2)`);
  console.log('  - Locais: 3 (DBS5, DGO2, TAG001)');
  console.log('  - Motoristas: 3 (com documentos e contratos)');
  console.log('  - Rotas: 2 exemplos (com snapshot de preços)');
  console.log('');
  console.log('🔑 Credenciais de acesso:');
  console.log('  Admin:      admin@temelio.com.br / 123456');
  console.log('  Planejador: planejador@temelio.com.br / 123456');
  console.log('  Motorista1: joao.silva@email.com / 123456');
  console.log('  Motorista2: maria.costa@email.com / 123456');
  console.log('  Motorista3: pedro.santos@email.com / 123456');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });