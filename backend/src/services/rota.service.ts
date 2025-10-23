import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { TipoVeiculo, TipoRota, CicloRota, StatusRota, StatusOferta, PropriedadeVeiculo } from '@prisma/client';

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

class RotaService {
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
      criadoPor
    } = data;

    // Validar data (não pode ser no passado)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataRotaNormalizada = new Date(dataRota);
    dataRotaNormalizada.setHours(0, 0, 0, 0);

    if (dataRotaNormalizada < hoje) {
      throw new AppError('Data da rota não pode ser anterior à data atual', 400);
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
    const propriedadeVeiculo = veiculoTransportadora
      ? PropriedadeVeiculo.TRANSPORTADORA
      : PropriedadeVeiculo.PROPRIO;

    // Mapeamento de TipoVeiculo para TipoServico
    const TIPO_VEICULO_TO_SERVICO: Record<string, string[]> = {
      'MOTOCICLETA': ['BIKE'],
      'CARRO_PASSEIO': ['PASSENGER'],
      'CARGO_VAN': ['CARGO_VAN', 'SMALL_VAN'],
      'LARGE_VAN': ['LARGE_VAN'],
    };

    // Buscar primeiro pelos campos legados (tipoVeiculo/propriedadeVeiculo)
    let tabelaPreco = await prisma.tabelaPreco.findFirst({
      where: {
        tipoVeiculo,
        propriedadeVeiculo,
        ativo: true,
        dataInicioVigencia: { lte: new Date() },
        OR: [
          { dataFimVigencia: null },
          { dataFimVigencia: { gte: new Date() } }
        ]
      }
    });

    // Se não encontrar, buscar pelos campos novos (tipoServico/propriedade)
    if (!tabelaPreco) {
      const tiposServico = TIPO_VEICULO_TO_SERVICO[tipoVeiculo] || [];
      const propriedade = veiculoTransportadora ? 'TRANSPORTADORA' : 'PROPRIO';

      for (const tipoServico of tiposServico) {
        tabelaPreco = await prisma.tabelaPreco.findFirst({
          where: {
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
    }

    if (!tabelaPreco) {
      throw new AppError('Tabela de preços não encontrada', 404);
    }

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
        cicloRota,
        tamanhoHoras,
        veiculoTransportadora,
        localId,
        valorHora: Number(valorHora),
        bonusPorHora: bonusPorHora || 0,
        bonusFixo: bonusFixo || 0,
        valorProjetado: Number(valorProjetado),
        valorTotalRota: Number(valorTotalRota),
        kmProjetado: kmProjetado || 50,
        status: StatusRota.DISPONIVEL,
        criadoPor
      },
      include: {
        local: true
      }
    });

    return rota;
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
    cicloRota?: CicloRota;
    tipoVeiculo?: TipoVeiculo;
    tipoRota?: TipoRota;
    dataInicio?: string;
    dataFim?: string;
    motoristaId?: string;
  } = {}) {
    const where: any = {};

    if (filtros.status) {
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

    if (filtros.dataInicio && filtros.dataFim) {
      where.dataRota = {
        gte: new Date(filtros.dataInicio),
        lte: new Date(filtros.dataFim)
      };
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

      const propriedadeVeiculo = veiculoTransportadora
        ? PropriedadeVeiculo.TRANSPORTADORA
        : PropriedadeVeiculo.PROPRIO;

      // Mapeamento de TipoVeiculo para TipoServico
      const TIPO_VEICULO_TO_SERVICO: Record<string, string[]> = {
        'MOTOCICLETA': ['BIKE'],
        'CARRO_PASSEIO': ['PASSENGER'],
        'CARGO_VAN': ['CARGO_VAN', 'SMALL_VAN'],
        'LARGE_VAN': ['LARGE_VAN'],
      };

      // Buscar primeiro pelos campos legados
      let tabelaPreco = await prisma.tabelaPreco.findFirst({
        where: {
          tipoVeiculo,
          propriedadeVeiculo,
          ativo: true,
          dataInicioVigencia: { lte: new Date() },
          OR: [
            { dataFimVigencia: null },
            { dataFimVigencia: { gte: new Date() } }
          ]
        }
      });

      // Se não encontrar, buscar pelos campos novos
      if (!tabelaPreco) {
        const tiposServico = TIPO_VEICULO_TO_SERVICO[tipoVeiculo] || [];
        const propriedade = veiculoTransportadora ? 'TRANSPORTADORA' : 'PROPRIO';

        for (const tipoServico of tiposServico) {
          tabelaPreco = await prisma.tabelaPreco.findFirst({
            where: {
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
      }

      if (!tabelaPreco) {
        throw new AppError('Tabela de preços não encontrada', 404);
      }

      // Atualizar tabelaPrecosId se foi encontrada uma nova tabela
      if (tabelaPreco.id !== data.tabelaPrecosId) {
        data.tabelaPrecosId = tabelaPreco.id;
      }
    }

    const rotaAtualizada = await prisma.rota.update({
      where: { id },
      data: {
        ...data,
        dataRota: data.dataRota ? new Date(data.dataRota) : undefined
      },
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