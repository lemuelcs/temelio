import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import {
  TipoVeiculo,
  TipoRota,
  CicloRota,
  StatusRota,
  StatusOferta,
  StatusTracking,
  Prisma,
} from '@prisma/client';

interface CriarRotaData {
  dataRota: Date;
  horaInicio: string;
  horaFim?: string;
  tipoVeiculo: TipoVeiculo;
  tipoRota: TipoRota;
  cicloRota: CicloRota;
  tamanhoHoras: number;
  localId: string;
  veiculoTransportadora: boolean;
  bonusPorHora?: number;
  bonusFixo?: number;
  kmProjetado?: number;
}

interface AuditData {
  usuarioId: string;
  ip: string;
  dispositivo: string;
  latitude?: number;
  longitude?: number;
}

interface AtualizarTrackingParams {
  rotaId: string;
  motoristaId: string;
  novoStatus: StatusTracking;
  latitude?: number | null;
  longitude?: number | null;
  observacao?: string;
  dispositivo?: string | null;
  ip?: string | null;
  insucessos?: number;
  quantidadePNOV?: number;
  satisfacaoMotorista?: string;
  feedbackMotorista?: string;
}

class RotaService {
  private readonly trackingSequencia: StatusTracking[] = [
    StatusTracking.AGUARDANDO,
    StatusTracking.A_CAMINHO,
    StatusTracking.NO_LOCAL,
    StatusTracking.ROTA_INICIADA,
    StatusTracking.ROTA_CONCLUIDA,
  ];

  // ========================================
  // D-1: CRIAR OFERTA DE ROTA
  // ========================================
  async criarOfertaD1(data: any) {
    const {
      dataRota,
      horaInicio,
      horaFim,
      tipoVeiculo,
      tipoRota,
      cicloRota,
      tamanhoHoras,
      localId,
      veiculoTransportadora,
      bonusPorHora,
      bonusFixo,
      kmProjetado,
      latitudeOrigem,
      longitudeOrigem,
      qtdePacotes,
      qtdeLocais,
      qtdeParadas,
      codigoRota,
      criadoPor
    } = data;

    // Validar data (não pode ser no passado)
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    const dataRotaNormalizada = new Date(dataRota);
    dataRotaNormalizada.setUTCHours(0, 0, 0, 0);

    if (dataRotaNormalizada < hoje) {
      throw new AppError('Data da rota não pode ser anterior à data atual', 400);
    }

    if (tipoRota === 'RESGATE') {
      const latitudeInformada = latitudeOrigem !== undefined && latitudeOrigem !== null;
      const longitudeInformada = longitudeOrigem !== undefined && longitudeOrigem !== null;

      if (!latitudeInformada || !longitudeInformada) {
        throw new AppError('Informe a latitude e a longitude da origem para rotas de resgate', 400);
      }
    }

    // Validar tamanho da rota
    if (tamanhoHoras < 1 || tamanhoHoras > 24) {
      throw new AppError('Tamanho da rota deve estar entre 1 e 24 horas', 400);
    }

    // Validar local
    const local = await prisma.local.findUnique({
      where: { id: localId }
    });

    if (!local) {
      throw new AppError('Local não encontrado', 404);
    }

    // Buscar tabela de preços
    // Mapeamento de TipoVeiculo para TipoServico
    const TIPO_VEICULO_TO_SERVICO: Record<string, string[]> = {
      'MOTOCICLETA': ['BIKE'],
      'CARRO_PASSEIO': ['PASSENGER'],
      'CARGO_VAN': ['CARGO_VAN', 'SMALL_VAN'],
      'LARGE_VAN': ['LARGE_VAN'],
    };

    // Buscar pelos campos tipoServico/propriedade
    const tiposServico = TIPO_VEICULO_TO_SERVICO[tipoVeiculo] || [];
    const propriedade = veiculoTransportadora ? 'TRANSPORTADORA' : 'PROPRIO';

    let tabelaPreco = null;
    for (const tipoServico of tiposServico) {
      tabelaPreco = await prisma.tabelaPreco.findFirst({
        where: {
          estacao: local.codigo,
          tipoServico: tipoServico as any,
          propriedade: propriedade as any,
          ativo: true,
          dataInicioVigencia: { lte: new Date() },
          OR: [
            { dataFimVigencia: null },
            { dataFimVigencia: { gte: new Date() } }
          ]
        }
      });

      if (tabelaPreco) break;
    }

    if (!tabelaPreco) {
      throw new AppError('Tabela de preços não encontrada', 404);
    }

    const cicloNormalizado = tipoRota === 'RESGATE' ? 'SEM_CICLO' : cicloRota;

    // Calcular valores
    const valorHora = tabelaPreco.valorHora;
    const valorBase = Number(valorHora) * tamanhoHoras;
    const valorBonusPorHora = (bonusPorHora || 0) * tamanhoHoras;
    const valorBonusFixo = bonusFixo || 0;
    const valorProjetado = valorBase + valorBonusPorHora + valorBonusFixo;
    const valorTotalRota = valorProjetado;

    // Criar rota
    const rota = await prisma.rota.create({
      data: {
        dataRota: new Date(dataRota),
        horaInicio: horaInicio,
        horaFim: horaFim || null,
        tipoVeiculo,
        tipoRota,
        cicloRota: cicloNormalizado,
        tamanhoHoras,
        veiculoTransportadora,
        localId,
        valorHora: Number(valorHora),
        bonusPorHora: bonusPorHora || 0,
        bonusFixo: bonusFixo || 0,
        valorProjetado: Number(valorProjetado),
        valorTotalRota: Number(valorTotalRota),
        kmProjetado: kmProjetado !== undefined && kmProjetado !== null ? Number(kmProjetado) : 50,
        latitudeOrigem: latitudeOrigem !== undefined ? Number(latitudeOrigem) : null,
        longitudeOrigem: longitudeOrigem !== undefined ? Number(longitudeOrigem) : null,
        qtdePacotes: qtdePacotes !== undefined && qtdePacotes !== null ? Number(qtdePacotes) : null,
        qtdeLocais: qtdeLocais !== undefined && qtdeLocais !== null ? Number(qtdeLocais) : null,
        qtdeParadas: qtdeParadas !== undefined && qtdeParadas !== null ? Number(qtdeParadas) : null,
        codigoRota: codigoRota ? String(codigoRota) : null,
        status: StatusRota.DISPONIVEL,
        criadoPor
      },
      include: {
        local: true
      }
    });

    return rota;
  }

  async criarOuRecriarOferta(
    rotaId: string,
    motoristaId: string,
    options: { forcarReoferta?: boolean } = {}
  ) {
    const { forcarReoferta = false } = options;
    const statusPermitidos = forcarReoferta
      ? [
          StatusRota.DISPONIVEL,
          StatusRota.RECUSADA,
          StatusRota.OFERTADA,
          StatusRota.ACEITA,
          StatusRota.CONFIRMADA,
        ]
      : [StatusRota.DISPONIVEL, StatusRota.RECUSADA, StatusRota.OFERTADA];

    return prisma.$transaction(async (tx) => {
      const rota = await tx.rota.findUnique({
        where: { id: rotaId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!rota) {
        throw new AppError('Rota não encontrada', 404);
      }

      if (!statusPermitidos.includes(rota.status as (typeof statusPermitidos)[number])) {
        throw new AppError('A rota selecionada não está disponível para oferta', 400);
      }

      await tx.ofertaRota.deleteMany({
        where: { rotaId },
      });

      const rotaAtualizada = await tx.rota.update({
        where: { id: rotaId },
        data: {
          status: StatusRota.OFERTADA,
          motoristaId: null,
          statusTracking: StatusTracking.AGUARDANDO,
          timestampACaminho: null,
          timestampNoLocal: null,
          timestampRotaIniciada: null,
          timestampRotaConcluida: null,
          horaInicioReal: null,
          horaFimReal: null,
        },
      });

      const oferta = await tx.ofertaRota.create({
        data: {
          rotaId,
          motoristaId,
          status: StatusOferta.PENDENTE,
          dataEnvio: new Date(),
        },
        include: {
          motorista: {
            select: {
              id: true,
              nomeCompleto: true,
              celular: true,
            },
          },
        },
      });

      return {
        rota: rotaAtualizada,
        oferta,
      };
    });
  }

  // ========================================
  // D+0: CONFIRMAR ROTA (Roteirização)
  // ========================================
  async confirmarRotaD0(rotaId: string, data: any) {
    const rota = await this.buscarPorId(rotaId);

    if (rota.status !== StatusRota.ACEITA) {
      throw new AppError('Apenas rotas aceitas podem ser confirmadas', 400);
    }

    const {
      codigoRota,
      qtdePacotes,
      qtdeLocais,
      qtdeParadas,
      horaInicioReal,
      horaFimReal
    } = data;

    // Atualizar rota
    const rotaAtualizada = await prisma.rota.update({
      where: { id: rotaId },
      data: {
        codigoRota,
        qtdePacotes: qtdePacotes ? parseInt(qtdePacotes) : null,
        qtdeLocais: qtdeLocais ? parseInt(qtdeLocais) : null,
        qtdeParadas: qtdeParadas ? parseInt(qtdeParadas) : null,
        horaInicioReal: horaInicioReal || null,
        horaFimReal: horaFimReal || null,
        status: StatusRota.CONFIRMADA
      },
      include: {
        local: true,
        motorista: {
          select: {
            id: true,
            nomeCompleto: true,
            celular: true
          }
        }
      }
    });

    return rotaAtualizada;
  }

  // ========================================
  // D+1: VALIDAR ROTA (Informar KM Real)
  // ========================================
  async validarRotaD1(rotaId: string, data: any) {
    const rota = await this.buscarPorId(rotaId);

    if (rota.status !== StatusRota.CONCLUIDA) {
      throw new AppError('Apenas rotas concluídas podem ser validadas', 400);
    }

    const { kmReal, validadoPor } = data;

    if (!kmReal || kmReal <= 0) {
      throw new AppError('KM real deve ser maior que zero', 400);
    }

    // Calcular bônus por KM
    const valorKm = Number(rota.valorKm) || 0.50;
    const valorBonusKm = kmReal * valorKm;
    const valorTotalRota = Number(rota.valorProjetado) + valorBonusKm;

    // Atualizar rota
    const rotaValidada = await prisma.rota.update({
      where: { id: rotaId },
      data: {
        kmReal,
        valorBonusKm,
        valorTotalRota,
        dataValidacao: new Date(),
        validadoPor,
        status: StatusRota.VALIDADA
      },
      include: {
        local: true,
        motorista: true
      }
    });

    return rotaValidada;
  }

  // ========================================
  // D+1: VALIDAR ROTAS EM LOTE
  // ========================================
  async validarRotasEmLote(rotas: Array<{ rotaId: string; kmReal: number }>, validadoPor: string) {
    let validadas = 0;
    let falhas = 0;
    const erros: any[] = [];

    for (const item of rotas) {
      try {
        await this.validarRotaD1(item.rotaId, {
          kmReal: item.kmReal,
          validadoPor
        });
        validadas++;
      } catch (error: any) {
        falhas++;
        erros.push({
          rotaId: item.rotaId,
          erro: error.message
        });
      }
    }

    return {
      validadas,
      falhas,
      total: rotas.length,
      erros
    };
  }

  // ========================================
  // LISTAR ROTAS
  // ========================================
  async listar(filtros: {
    status?: StatusRota;
    statusLista?: StatusRota[];
    cicloRota?: CicloRota;
    tipoVeiculo?: TipoVeiculo;
    tipoRota?: TipoRota;
    dataInicio?: string;
    dataFim?: string;
    motoristaId?: string;
  } = {}) {
    const where: any = {};

    if (filtros.statusLista && filtros.statusLista.length > 0) {
      where.status = { in: filtros.statusLista };
    } else if (filtros.status) {
      where.status = filtros.status;
    }

    if (filtros.cicloRota) {
      where.cicloRota = filtros.cicloRota;
    }

    if (filtros.tipoVeiculo) {
      where.tipoVeiculo = filtros.tipoVeiculo;
    }

    if (filtros.tipoRota) {
      where.tipoRota = filtros.tipoRota;
    }

    if (filtros.dataInicio || filtros.dataFim) {
      const dataRotaFiltro: any = {};

      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        inicio.setHours(0, 0, 0, 0);
        dataRotaFiltro.gte = inicio;
      }

      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        fim.setHours(23, 59, 59, 999);
        dataRotaFiltro.lte = fim;
      }

      where.dataRota = dataRotaFiltro;
    }

    if (filtros.motoristaId) {
      where.motoristaId = filtros.motoristaId;
    }

    const rotas = await prisma.rota.findMany({
      where,
      include: {
        local: true,
        motorista: {
          select: {
            id: true,
            nomeCompleto: true,
            celular: true,
            tipoVeiculo: true,
            status: true
          }
        },
        ofertas: {
          include: {
            motorista: {
              select: {
                id: true,
                nomeCompleto: true
              }
            }
          }
        },
        historicosTracking: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: [
        { dataRota: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    return rotas;
  }

  // ========================================
  // LISTAR ROTAS PARA VALIDAÇÃO
  // ========================================
  async listarRotasParaValidacao(dataReferencia?: Date) {
    const data = dataReferencia || new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);

    const rotas = await prisma.rota.findMany({
      where: {
        dataRota: {
          gte: dataInicio,
          lte: dataFim
        },
        status: StatusRota.CONCLUIDA
      },
      include: {
        local: true,
        motorista: {
          select: {
            id: true,
            nomeCompleto: true,
            celular: true
          }
        }
      },
      orderBy: {
        horaInicio: 'asc'
      }
    });

    return rotas;
  }

  // ========================================
  // BUSCAR ROTA POR ID
  // ========================================
  async buscarPorId(id: string) {
    const rota = await prisma.rota.findUnique({
      where: { id },
      include: {
        local: true,
        motorista: {
          select: {
            id: true,
            nomeCompleto: true,
            celular: true,
            tipoVeiculo: true,
            status: true
          }
        },
        ofertas: {
          include: {
            motorista: {
              select: {
                id: true,
                nomeCompleto: true,
                celular: true
              }
            }
          }
        }
      }
    });

    if (!rota) {
      throw new AppError('Rota não encontrada', 404);
    }

    return rota;
  }

  // ========================================
  // ATUALIZAR ROTA
  // ========================================
  async atualizar(id: string, data: any) {
    const rota = await this.buscarPorId(id);

    if (rota.status !== StatusRota.DISPONIVEL) {
      throw new AppError('Apenas rotas disponíveis podem ser editadas', 400);
    }

    // Se estiver mudando tipoVeiculo ou veiculoTransportadora, validar tabela de preços
    if (data.tipoVeiculo || data.veiculoTransportadora !== undefined) {
      const tipoVeiculo = data.tipoVeiculo || rota.tipoVeiculo;
      const veiculoTransportadora = data.veiculoTransportadora !== undefined
        ? data.veiculoTransportadora
        : rota.veiculoTransportadora;

      // Buscar o local para obter a estação
      const local = await prisma.local.findUnique({
        where: { id: rota.localId }
      });

      if (!local) {
        throw new AppError('Local não encontrado', 404);
      }

      // Mapeamento de TipoVeiculo para TipoServico
      const TIPO_VEICULO_TO_SERVICO: Record<string, string[]> = {
        'MOTOCICLETA': ['BIKE'],
        'CARRO_PASSEIO': ['PASSENGER'],
        'CARGO_VAN': ['CARGO_VAN', 'SMALL_VAN'],
        'LARGE_VAN': ['LARGE_VAN'],
      };

      // Buscar pelos campos tipoServico/propriedade
      const tiposServico = TIPO_VEICULO_TO_SERVICO[tipoVeiculo] || [];
      const propriedade = veiculoTransportadora ? 'TRANSPORTADORA' : 'PROPRIO';

      let tabelaPreco = null;
      for (const tipoServico of tiposServico) {
        tabelaPreco = await prisma.tabelaPreco.findFirst({
          where: {
            estacao: local.codigo,
            tipoServico: tipoServico as any,
            propriedade: propriedade as any,
            ativo: true,
            dataInicioVigencia: { lte: new Date() },
            OR: [
              { dataFimVigencia: null },
              { dataFimVigencia: { gte: new Date() } }
            ]
          }
        });

        if (tabelaPreco) break;
      }

      if (!tabelaPreco) {
        throw new AppError('Tabela de preços não encontrada', 404);
      }

      // Atualizar tabelaPrecosId se foi encontrada uma nova tabela
      if (tabelaPreco.id !== data.tabelaPrecosId) {
        data.tabelaPrecosId = tabelaPreco.id;
      }
    }

    const dadosAtualizacao: any = { ...data };

    if (dadosAtualizacao.dataRota) {
      dadosAtualizacao.dataRota = new Date(dadosAtualizacao.dataRota);
    }

    if (dadosAtualizacao.tipoRota === 'RESGATE') {
      dadosAtualizacao.cicloRota = 'SEM_CICLO';
    }

    if (dadosAtualizacao.latitudeOrigem !== undefined) {
      dadosAtualizacao.latitudeOrigem = dadosAtualizacao.latitudeOrigem !== null
        ? Number(dadosAtualizacao.latitudeOrigem)
        : null;
    }

    if (dadosAtualizacao.longitudeOrigem !== undefined) {
      dadosAtualizacao.longitudeOrigem = dadosAtualizacao.longitudeOrigem !== null
        ? Number(dadosAtualizacao.longitudeOrigem)
        : null;
    }

    if (dadosAtualizacao.qtdePacotes !== undefined) {
      dadosAtualizacao.qtdePacotes = dadosAtualizacao.qtdePacotes !== null
        ? Number(dadosAtualizacao.qtdePacotes)
        : null;
    }

    if (dadosAtualizacao.qtdeLocais !== undefined) {
      dadosAtualizacao.qtdeLocais = dadosAtualizacao.qtdeLocais !== null
        ? Number(dadosAtualizacao.qtdeLocais)
        : null;
    }

    if (dadosAtualizacao.qtdeParadas !== undefined) {
      dadosAtualizacao.qtdeParadas = dadosAtualizacao.qtdeParadas !== null
        ? Number(dadosAtualizacao.qtdeParadas)
        : null;
    }

    if (dadosAtualizacao.kmProjetado !== undefined) {
      dadosAtualizacao.kmProjetado = dadosAtualizacao.kmProjetado !== null
        ? Number(dadosAtualizacao.kmProjetado)
        : null;
    }

    if (dadosAtualizacao.codigoRota !== undefined && dadosAtualizacao.codigoRota !== null) {
      dadosAtualizacao.codigoRota = String(dadosAtualizacao.codigoRota);
    }

    const rotaAtualizada = await prisma.rota.update({
      where: { id },
      data: dadosAtualizacao,
      include: {
        local: true
      }
    });

    return rotaAtualizada;
  }

  // ========================================
  // CANCELAR ROTA
  // ========================================
  async cancelar(rotaId: string, motivo: string, valorCancelamento?: number) {
    const rota = await this.buscarPorId(rotaId);

    if (rota.status === StatusRota.CONCLUIDA || rota.status === StatusRota.VALIDADA) {
      throw new AppError('Não é possível cancelar rotas concluídas ou validadas', 400);
    }

    const rotaCancelada = await prisma.rota.update({
      where: { id: rotaId },
      data: {
        status: StatusRota.CANCELADA,
        motivoCancelamento: motivo,
        dataCancelamento: new Date(),
        valorCancelamento: valorCancelamento || 0
      },
      include: {
        local: true,
        motorista: true
      }
    });

    // Expirar ofertas pendentes
    await prisma.ofertaRota.updateMany({
      where: {
        rotaId,
        status: { in: [StatusOferta.PENDENTE, StatusOferta.ACEITA] }
      },
      data: {
        status: StatusOferta.EXPIRADA
      }
    });

    return rotaCancelada;
  }

  // ========================================
  // EXCLUIR ROTA
  // ========================================
  async excluir(rotaId: string) {
    const rota = await this.buscarPorId(rotaId);

    if (rota.status !== StatusRota.DISPONIVEL) {
      throw new AppError('Apenas rotas disponíveis podem ser excluídas', 400);
    }

    await prisma.rota.delete({
      where: { id: rotaId }
    });

    return {
      message: 'Rota excluída com sucesso'
    };
  }

  async cancelarOfertas(rotaId: string) {
    return prisma.$transaction(async (tx) => {
      const rota = await tx.rota.findUnique({
        where: { id: rotaId },
        select: {
          id: true,
        },
      });

      if (!rota) {
        throw new AppError('Rota não encontrada', 404);
      }

      await tx.ofertaRota.deleteMany({
        where: { rotaId },
      });

      const rotaAtualizada = await tx.rota.update({
        where: { id: rotaId },
        data: {
          status: StatusRota.DISPONIVEL,
          motoristaId: null,
          statusTracking: StatusTracking.AGUARDANDO,
          timestampACaminho: null,
          timestampNoLocal: null,
          timestampRotaIniciada: null,
          timestampRotaConcluida: null,
          horaInicioReal: null,
          horaFimReal: null,
        },
      });

      return rotaAtualizada;
    });
  }

  // ========================================
  // ATUALIZAR TRACKING (MOTORISTA)
  // ========================================
  async atualizarTracking({
    rotaId,
    motoristaId,
    novoStatus,
    latitude,
    longitude,
    observacao,
    dispositivo,
    ip,
    insucessos,
    quantidadePNOV,
    satisfacaoMotorista,
    feedbackMotorista,
  }: AtualizarTrackingParams) {
    const rota = await prisma.rota.findUnique({
      where: { id: rotaId },
      include: {
        motorista: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!rota) {
      throw new AppError('Rota não encontrada', 404);
    }

    if (rota.motoristaId !== motoristaId) {
      throw new AppError('Rota não pertence ao motorista autenticado', 403);
    }

    const statusAtual = rota.statusTracking ?? StatusTracking.AGUARDANDO;
    const { indiceAtual, indiceNovo } = this.validarTransicaoTracking(statusAtual, novoStatus);

    this.validarStatusRotaParaTracking(rota.status, novoStatus, indiceAtual, indiceNovo);

    const agora = new Date();
    const updateData: any = {
      statusTracking: novoStatus,
    };

    if (novoStatus === StatusTracking.A_CAMINHO) {
      updateData.timestampACaminho = agora;
    }

    if (novoStatus === StatusTracking.NO_LOCAL) {
      updateData.timestampNoLocal = agora;
    }

    if (novoStatus === StatusTracking.ROTA_INICIADA) {
      updateData.timestampRotaIniciada = agora;
      updateData.status = StatusRota.EM_ANDAMENTO;
      updateData.horaInicioReal = agora;
    }

    if (novoStatus === StatusTracking.ROTA_CONCLUIDA) {
      updateData.timestampRotaConcluida = agora;
      updateData.status = StatusRota.CONCLUIDA;
      updateData.horaFimReal = agora;
    }

    const latitudeDecimal =
      latitude !== undefined && latitude !== null
        ? new Prisma.Decimal(Number(latitude).toFixed(8))
        : null;

    const longitudeDecimal =
      longitude !== undefined && longitude !== null
        ? new Prisma.Decimal(Number(longitude).toFixed(8))
        : null;

    const resultado = await prisma.$transaction(async (tx) => {
      const rotaAtualizada = await tx.rota.update({
        where: { id: rotaId },
        data: updateData,
        include: {
          local: true,
          motorista: {
            select: {
              id: true,
              nomeCompleto: true,
              celular: true,
              tipoVeiculo: true,
              status: true,
            },
          },
          metricaEntrega: true,
        },
      });

      await tx.historicoTrackingRota.create({
        data: {
          rotaId,
          motoristaId,
          status: novoStatus,
          latitude: latitudeDecimal,
          longitude: longitudeDecimal,
          dispositivo: dispositivo ? dispositivo.substring(0, 255) : null,
          ip: ip ? ip.substring(0, 45) : null,
          observacao: observacao || null,
        },
      });

      if (novoStatus === StatusTracking.ROTA_CONCLUIDA) {
        await this.registrarConclusaoRota(tx, rotaAtualizada, {
          motoristaId,
          insucessos,
          quantidadePNOV,
          satisfacaoMotorista,
          feedbackMotorista,
        });
      }

      return rotaAtualizada;
    });

    return resultado;
  }

  private validarTransicaoTracking(statusAtual: StatusTracking, novoStatus: StatusTracking) {
    const indiceAtual = this.trackingSequencia.indexOf(statusAtual);
    const indiceNovo = this.trackingSequencia.indexOf(novoStatus);

    if (indiceNovo === -1) {
      throw new AppError('Status de tracking inválido', 400);
    }

    if (indiceNovo < indiceAtual) {
      throw new AppError('Não é possível regressar o status de tracking', 400);
    }

    if (indiceNovo > indiceAtual + 1) {
      throw new AppError('Atualize o status de tracking na ordem correta', 400);
    }

    return { indiceAtual, indiceNovo };
  }

  private validarStatusRotaParaTracking(
    statusRota: StatusRota,
    novoStatus: StatusTracking,
    indiceAtual: number,
    indiceNovo: number,
  ) {
    const statusQueExigemConfirmacao = new Set<StatusTracking>([
      StatusTracking.A_CAMINHO,
      StatusTracking.NO_LOCAL,
    ]);
    if (statusQueExigemConfirmacao.has(novoStatus)) {
      if (statusRota !== StatusRota.CONFIRMADA) {
        throw new AppError('A rota precisa estar confirmada para atualizar o tracking', 400);
      }
    }

    if (novoStatus === StatusTracking.ROTA_INICIADA) {
      const statusValidos = new Set<StatusRota>([StatusRota.CONFIRMADA, StatusRota.EM_ANDAMENTO]);
      if (!statusValidos.has(statusRota as StatusRota)) {
        throw new AppError('A rota precisa estar confirmada para ser iniciada', 400);
      }
    }

    if (novoStatus === StatusTracking.ROTA_CONCLUIDA) {
      if (statusRota !== StatusRota.EM_ANDAMENTO && indiceNovo > indiceAtual) {
        throw new AppError('A rota precisa estar em andamento para ser concluída', 400);
      }
    }
  }

  private async registrarConclusaoRota(
    tx: Prisma.TransactionClient,
    rota: any,
    dados: {
      motoristaId: string;
      insucessos?: number;
      quantidadePNOV?: number;
      satisfacaoMotorista?: string;
      feedbackMotorista?: string;
    },
  ) {
    const totalPacotes = Number(rota.qtdePacotes ?? 0);
    const pacotesRetornados = Number(dados.insucessos ?? 0);
    const quantidadePNOV = Number(dados.quantidadePNOV ?? 0);
    const pacotesEntregues = Math.max(totalPacotes - pacotesRetornados - quantidadePNOV, 0);
    const pacotesPNOV = quantidadePNOV;
    const pacotesDNR = 0;
    const taxaDRCValor =
      totalPacotes > 0 ? ((pacotesRetornados + quantidadePNOV) / totalPacotes) * 100 : 0;
    const taxaDRC = new Prisma.Decimal(taxaDRCValor.toFixed(2));

    const dataReferencia = new Date(rota.dataRota);
    dataReferencia.setHours(0, 0, 0, 0);

    const horaInicio =
      rota.horaInicioReal ?? rota.timestampRotaIniciada ?? new Date(rota.dataRota);
    const horaFim = rota.horaFimReal ?? rota.timestampRotaConcluida ?? new Date();
    const duracaoEmMinutos =
      horaInicio && horaFim
        ? Math.max(Math.round((horaFim.getTime() - horaInicio.getTime()) / 60000), 0)
        : null;

    await tx.metricaEntrega.upsert({
      where: { rotaId: rota.id },
      create: {
        rotaId: rota.id,
        motoristaId: dados.motoristaId,
        data: dataReferencia,
        totalPacotes,
        pacotesEntregues,
        pacotesRetornados,
        pacotesPNOV,
        pacotesDNR,
        taxaDRC,
        horarioCarregamento: horaInicio,
        horarioChegada: horaFim,
        atrasouCarregamento: false,
        minutosAtraso: null,
        satisfacaoMotorista: dados.satisfacaoMotorista || null,
        feedbackMotorista: dados.feedbackMotorista || null,
        horaInicioRota: horaInicio,
        horaFimRota: horaFim,
        duracaoEmMinutos: duracaoEmMinutos ?? null,
      },
      update: {
        motoristaId: dados.motoristaId,
        data: dataReferencia,
        totalPacotes,
        pacotesEntregues,
        pacotesRetornados,
        pacotesPNOV,
        pacotesDNR,
        taxaDRC,
        horarioCarregamento: horaInicio,
        horarioChegada: horaFim,
        atrasouCarregamento: false,
        minutosAtraso: null,
        satisfacaoMotorista: dados.satisfacaoMotorista || null,
        feedbackMotorista: dados.feedbackMotorista || null,
        horaInicioRota: horaInicio,
        horaFimRota: horaFim,
        duracaoEmMinutos: duracaoEmMinutos ?? null,
      },
    });
  }

  // ========================================
  // OBTER TABELA DE PREÇOS
  // ========================================
  obterTabelaPrecos() {
    return {
      MOTOCICLETA: 27.00,
      CARRO_PASSEIO: 37.00,
      CARGO_VAN: 40.00,
      LARGE_VAN: 52.50,
      TRANSPORTADORA: 25.00,
      BONUS_POR_KM: 0.64
    };
  }
}

export default new RotaService();
