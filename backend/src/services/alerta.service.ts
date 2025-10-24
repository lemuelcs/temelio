import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';

interface GerarAlertasResult {
  alertasGerados: number;
  alertas: any[];
}

class AlertaService {
  // Gerar alertas de compliance para todos os motoristas ativos
  async gerarAlertasCompliance(): Promise<GerarAlertasResult> {
    const motoristas = await prisma.motorista.findMany({
      where: {
        status: 'ATIVO'
      },
      include: {
        documento: true,
        contratos: {
          where: { ativo: true }
        }
      }
    });

    const alertasGerados = [];

    for (const motorista of motoristas) {
      const alertas = await this.verificarComplianceMotorista(motorista.id);
      alertasGerados.push(...alertas);
    }

    return {
      alertasGerados: alertasGerados.length,
      alertas: alertasGerados
    };
  }

  // Verificar compliance de um motorista específico
  async verificarComplianceMotorista(motoristaId: string) {
    const motorista = await prisma.motorista.findUnique({
      where: { id: motoristaId },
      include: {
        documento: true,
        contratos: {
          where: { ativo: true }
        }
      }
    });

    if (!motorista) {
      throw new AppError('Motorista não encontrado', 404);
    }

    const alertas = [];
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    // 1. Verificar idade do veículo
    if (motorista.anoFabricacaoVeiculo) {
      const idadeVeiculo = anoAtual - motorista.anoFabricacaoVeiculo;

      if (idadeVeiculo > 15) {
        const alerta = await this.criarAlerta({
          tipo: 'VEICULO_IDADE_EXCEDIDA',
          motoristaId,
          titulo: 'Veículo com mais de 15 anos',
          descricao: `Veículo fabricado em ${motorista.anoFabricacaoVeiculo} possui ${idadeVeiculo} anos. Limite máximo: 15 anos.`,
          severidade: 'CRITICA'
        });
        alertas.push(alerta);
      } else if (idadeVeiculo === 15) {
        const alerta = await this.criarAlerta({
          tipo: 'VEICULO_IDADE_LIMITE',
          motoristaId,
          titulo: 'Veículo atingiu limite de idade',
          descricao: `Veículo fabricado em ${motorista.anoFabricacaoVeiculo} possui ${idadeVeiculo} anos. Limite permitido: 15 anos.`,
          severidade: 'ALTA'
        });
        alertas.push(alerta);
      } else if (idadeVeiculo >= 14) {
        const alerta = await this.criarAlerta({
          tipo: 'VEICULO_IDADE_ATENCAO',
          motoristaId,
          titulo: 'Veículo próximo do limite de idade',
          descricao: `Veículo fabricado em ${motorista.anoFabricacaoVeiculo} possui ${idadeVeiculo} anos. Limite: 15 anos.`,
          severidade: 'MEDIA'
        });
        alertas.push(alerta);
      }
    }

    const documento = motorista.documento;

    if (documento) {
      // 2. Verificar CNH
      if (documento.validadeCNH) {
        const diasParaVencer = Math.ceil(
          (documento.validadeCNH.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasParaVencer < 0) {
          const alerta = await this.criarAlerta({
            tipo: 'CNH_VENCIDA',
            motoristaId,
            titulo: 'CNH vencida',
            descricao: `CNH venceu há ${Math.abs(diasParaVencer)} dias. Validade: ${documento.validadeCNH.toLocaleDateString('pt-BR')}`,
            severidade: 'CRITICA'
          });
          alertas.push(alerta);
        } else if (diasParaVencer <= 30) {
          const alerta = await this.criarAlerta({
            tipo: 'CNH_VENCENDO',
            motoristaId,
            titulo: 'CNH vencendo',
            descricao: `CNH vence em ${diasParaVencer} dias. Validade: ${documento.validadeCNH.toLocaleDateString('pt-BR')}`,
            severidade: diasParaVencer <= 7 ? 'ALTA' : 'MEDIA'
          });
          alertas.push(alerta);
        }
      } else {
        const alerta = await this.criarAlerta({
          tipo: 'CNH_NAO_CADASTRADA',
          motoristaId,
          titulo: 'CNH não cadastrada',
          descricao: 'Dados da CNH não foram cadastrados no sistema',
          severidade: 'ALTA'
        });
        alertas.push(alerta);
      }

      // 3. Verificar CRLV (Licenciamento)
      if (documento.anoLicenciamento) {
        if (documento.anoLicenciamento < anoAtual - 1) {
          const alerta = await this.criarAlerta({
            tipo: 'CRLV_DESATUALIZADO',
            motoristaId,
            titulo: 'CRLV desatualizado',
            descricao: `Licenciamento de ${documento.anoLicenciamento}. Deve ser ${anoAtual} ou ${anoAtual - 1}`,
            severidade: 'CRITICA'
          });
          alertas.push(alerta);
        } else if (documento.anoLicenciamento === anoAtual - 1) {
          const alerta = await this.criarAlerta({
            tipo: 'CRLV_ATENCAO',
            motoristaId,
            titulo: 'CRLV precisa renovação',
            descricao: `Licenciamento de ${documento.anoLicenciamento}. Recomenda-se atualizar para ${anoAtual}`,
            severidade: 'MEDIA'
          });
          alertas.push(alerta);
        }
      } else {
        const alerta = await this.criarAlerta({
          tipo: 'CRLV_NAO_CADASTRADO',
          motoristaId,
          titulo: 'CRLV não cadastrado',
          descricao: 'Ano do licenciamento não foi cadastrado no sistema',
          severidade: 'ALTA'
        });
        alertas.push(alerta);
      }

      // 4. Verificar BRK
      if (documento.proximaVerificacaoBRK) {
        const diasParaVencer = Math.ceil(
          (documento.proximaVerificacaoBRK.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasParaVencer < 0) {
          const alerta = await this.criarAlerta({
            tipo: 'BRK_VENCIDO',
            motoristaId,
            titulo: 'Verificação BRK vencida',
            descricao: `BRK venceu há ${Math.abs(diasParaVencer)} dias. Próxima verificação: ${documento.proximaVerificacaoBRK.toLocaleDateString('pt-BR')}`,
            severidade: 'CRITICA'
          });
          alertas.push(alerta);
        } else if (diasParaVencer <= 30) {
          const alerta = await this.criarAlerta({
            tipo: 'BRK_VENCENDO',
            motoristaId,
            titulo: 'Verificação BRK vencendo',
            descricao: `BRK vence em ${diasParaVencer} dias. Próxima verificação: ${documento.proximaVerificacaoBRK.toLocaleDateString('pt-BR')}`,
            severidade: diasParaVencer <= 7 ? 'ALTA' : 'MEDIA'
          });
          alertas.push(alerta);
        }
      }

      if (!documento.statusBRK) {
        const alerta = await this.criarAlerta({
          tipo: 'BRK_NAO_APROVADO',
          motoristaId,
          titulo: 'BRK não aprovado',
          descricao: 'Verificação de antecedentes criminais não foi aprovada',
          severidade: 'CRITICA'
        });
        alertas.push(alerta);
      }
    } else {
      // Sem documentos cadastrados
      const alerta = await this.criarAlerta({
        tipo: 'DOCUMENTOS_NAO_CADASTRADOS',
        motoristaId,
        titulo: 'Documentos não cadastrados',
        descricao: 'Nenhum documento foi cadastrado para este motorista',
        severidade: 'CRITICA'
      });
      alertas.push(alerta);
    }

    // 5. Verificar contrato
    if (!motorista.contratos || motorista.contratos.length === 0) {
      const alerta = await this.criarAlerta({
        tipo: 'CONTRATO_INATIVO',
        motoristaId,
        titulo: 'Sem contrato ativo',
        descricao: 'Motorista não possui contrato ativo',
        severidade: 'CRITICA'
      });
      alertas.push(alerta);
    }

    return alertas;
  }

  // Criar ou atualizar alerta (evita duplicação)
  private async criarAlerta(dados: {
    tipo: string;
    motoristaId: string;
    titulo: string;
    descricao: string;
    severidade: string;
  }) {
    // Verificar se já existe alerta não resolvido do mesmo tipo para este motorista
    const alertaExistente = await prisma.alerta.findFirst({
      where: {
        tipo: dados.tipo,
        motoristaId: dados.motoristaId,
        resolvido: false
      }
    });

    if (alertaExistente) {
      // Atualizar alerta existente
      return await prisma.alerta.update({
        where: { id: alertaExistente.id },
        data: {
          descricao: dados.descricao,
          updatedAt: new Date()
        }
      });
    }

    // Criar novo alerta
    return await prisma.alerta.create({
      data: dados
    });
  }

  // Listar alertas
  async listar(filtros: {
    motoristaId?: string;
    tipo?: string;
    severidade?: string;
    resolvido?: boolean;
  } = {}) {
    const where: any = {};

    if (filtros.motoristaId) {
      where.motoristaId = filtros.motoristaId;
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.severidade) {
      where.severidade = filtros.severidade;
    }

    if (filtros.resolvido !== undefined) {
      where.resolvido = filtros.resolvido;
    }

    const alertas = await prisma.alerta.findMany({
      where,
      include: {
        motorista: {
          select: {
            id: true,
            transporterId: true,
            nomeCompleto: true,
            celular: true,
            status: true
          }
        }
      },
      orderBy: [
        { resolvido: 'asc' },
        { severidade: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return alertas;
  }

  // Buscar alerta por ID
  async buscarPorId(id: string) {
    const alerta = await prisma.alerta.findUnique({
      where: { id },
      include: {
        motorista: {
          select: {
            id: true,
            transporterId: true,
            nomeCompleto: true,
            celular: true,
            status: true
          }
        }
      }
    });

    if (!alerta) {
      throw new AppError('Alerta não encontrado', 404);
    }

    return alerta;
  }

  // Resolver alerta
  async resolver(id: string) {
    const alerta = await this.buscarPorId(id);

    if (alerta.resolvido) {
      throw new AppError('Alerta já foi resolvido', 400);
    }

    return await prisma.alerta.update({
      where: { id },
      data: {
        resolvido: true,
        dataResolucao: new Date()
      }
    });
  }

  // Reabrir alerta
  async reabrir(id: string) {
    const alerta = await this.buscarPorId(id);

    if (!alerta.resolvido) {
      throw new AppError('Alerta já está aberto', 400);
    }

    return await prisma.alerta.update({
      where: { id },
      data: {
        resolvido: false,
        dataResolucao: null
      }
    });
  }

  // Dashboard de compliance
  async dashboardCompliance() {
    const totalMotoristas = await prisma.motorista.count({
      where: { status: 'ATIVO' }
    });

    const alertasAbertos = await prisma.alerta.count({
      where: { resolvido: false }
    });

    const alertasPorSeveridade = await prisma.alerta.groupBy({
      by: ['severidade'],
      where: { resolvido: false },
      _count: true
    });

    const alertasPorTipo = await prisma.alerta.groupBy({
      by: ['tipo'],
      where: { resolvido: false },
      _count: true
    });

    const motoristasComAlerta = await prisma.alerta.findMany({
      where: { resolvido: false },
      distinct: ['motoristaId'],
      select: { motoristaId: true }
    });

    const percentualCompliance = totalMotoristas > 0
      ? ((totalMotoristas - motoristasComAlerta.length) / totalMotoristas) * 100
      : 100;

    return {
      totalMotoristas,
      motoristasComAlerta: motoristasComAlerta.length,
      motoristasCompliant: totalMotoristas - motoristasComAlerta.length,
      percentualCompliance: Number(percentualCompliance.toFixed(2)),
      alertasAbertos,
      alertasPorSeveridade: alertasPorSeveridade.map(a => ({
        severidade: a.severidade,
        total: a._count
      })),
      alertasPorTipo: alertasPorTipo.map(a => ({
        tipo: a.tipo,
        total: a._count
      }))
    };
  }

  // Excluir alertas antigos resolvidos (limpeza)
  async limparAlertasResolvidos(diasAntigos: number = 90) {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAntigos);

    const resultado = await prisma.alerta.deleteMany({
      where: {
        resolvido: true,
        dataResolucao: {
          lt: dataLimite
        }
      }
    });

    return {
      alertasExcluidos: resultado.count
    };
  }
}

export default new AlertaService();
