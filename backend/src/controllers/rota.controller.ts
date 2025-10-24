import { Request, Response } from 'express';
import rotaService from '../services/rota.service';
import { TipoVeiculo, TipoRota, CicloRota, StatusRota, StatusOferta, StatusTracking } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';

class RotaController {
  private async obterMotoristaIdPorUsuario(req: Request): Promise<string> {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      console.warn('[RotaController] Requisição sem usuário autenticado.');
      throw new AppError('Usuário não autenticado', 401);
    }

    const motorista = await prisma.motorista.findFirst({
      where: { usuarioId },
      select: { id: true },
    });

    if (!motorista) {
      console.warn('[RotaController] Nenhum motorista vinculado ao usuário', { usuarioId });
      throw new AppError('Motorista não encontrado para este usuário', 404);
    }

    console.debug('[RotaController] Motorista associado encontrado', {
      usuarioId,
      motoristaId: motorista.id,
    });

    return motorista.id;
  }

  // ========================================
  // D-1: CRIAR OFERTA DE ROTA
  // ========================================
  
  async criarOferta(req: Request, res: Response) {
    try {
      const data = {
        ...req.body,
        criadoPor: req.user?.id || 'sistema'
      };

      const rota = await rotaService.criarOfertaD1(data);

      return res.status(201).json({
        status: 'success',
        message: 'Oferta de rota criada com sucesso',
        data: rota
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Erro ao criar oferta de rota'
      });
    }
  }

  // ========================================
  // D+0: CONFIRMAR ROTA (Roteirização)
  // ========================================
  
  async confirmarRota(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rota = await rotaService.confirmarRotaD0(id, req.body);

      return res.json({
        status: 'success',
        message: 'Rota confirmada com sucesso',
        data: rota
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Erro ao confirmar rota'
      });
    }
  }

  // ========================================
  // D+1: VALIDAR ROTA (Informar KM)
  // ========================================
  
  async validarRota(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        validadoPor: req.user?.id || 'sistema'
      };

      const rota = await rotaService.validarRotaD1(id, data);

      return res.json({
        status: 'success',
        message: 'Rota validada com sucesso',
        data: rota
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Erro ao validar rota'
      });
    }
  }

  // ========================================
  // D+1: VALIDAR ROTAS EM LOTE
  // ========================================
  
  async validarRotasEmLote(req: Request, res: Response) {
    try {
      const { rotas } = req.body;
      const validadoPor = req.user?.id || 'sistema';

      if (!Array.isArray(rotas) || rotas.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'É necessário fornecer um array de rotas para validar'
        });
      }

      const resultado = await rotaService.validarRotasEmLote(rotas, validadoPor);

      return res.json({
        status: 'success',
        message: `${resultado.validadas} rotas validadas com sucesso, ${resultado.falhas} falhas`,
        data: resultado
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Erro ao validar rotas em lote'
      });
    }
  }

  // ========================================
  // LISTAR ROTAS
  // ========================================
  
  async listar(req: Request, res: Response) {
    try {
      const statusQuery = req.query.status;
      const statusEnumValues = Object.values(StatusRota);

      const parseStatus = (value?: string | null): StatusRota | undefined => {
        if (!value) return undefined;
        const normalized = value.toString().toUpperCase() as StatusRota;
        return statusEnumValues.includes(normalized) ? normalized : undefined;
      };

      let statusLista: StatusRota[] | undefined;
      let statusUnico: StatusRota | undefined;

      if (Array.isArray(statusQuery)) {
        statusLista = statusQuery
          .map((valor) => parseStatus(typeof valor === 'string' ? valor : String(valor)))
          .filter((valor): valor is StatusRota => Boolean(valor));
      } else if (typeof statusQuery === 'string') {
        if (statusQuery.includes(',')) {
          statusLista = statusQuery
            .split(',')
            .map((valor) => parseStatus(valor.trim()))
            .filter((valor): valor is StatusRota => Boolean(valor));
        } else {
          statusUnico = parseStatus(statusQuery);
        }
      }

      const filtros = {
        status: statusUnico,
        statusLista,
        cicloRota: req.query.cicloRota as CicloRota,
        tipoVeiculo: req.query.tipoVeiculo as TipoVeiculo,
        tipoRota: req.query.tipoRota as TipoRota,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
        motoristaId: req.query.motoristaId as string,
      };

      if (req.user?.perfil === 'MOTORISTA') {
        filtros.motoristaId = await this.obterMotoristaIdPorUsuario(req);
        console.debug('[RotaController] Forçando filtro de motorista para usuário logado', {
          usuarioId: req.user?.id,
          motoristaId: filtros.motoristaId,
        });
      }

      const rotas = await rotaService.listar(filtros);

      console.debug('[RotaController] Rotas encontradas para filtros', {
        filtros,
        quantidade: rotas.length,
      });

      return res.json({
        status: 'success',
        data: {
          rotas,
          total: rotas.length
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Erro ao listar rotas'
      });
    }
  }

  // ========================================
  // LISTAR ROTAS PARA VALIDAÇÃO (D+1)
  // ========================================
  
  async listarRotasParaValidacao(req: Request, res: Response) {
    try {
      const dataReferencia = req.query.data 
        ? new Date(req.query.data as string) 
        : undefined;

      const rotas = await rotaService.listarRotasParaValidacao(dataReferencia);

      return res.json({
        status: 'success',
        data: {
          rotas,
          total: rotas.length,
          dataReferencia: dataReferencia || new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Erro ao listar rotas para validação'
      });
    }
  }

  // ========================================
  // BUSCAR ROTA POR ID
  // ========================================
  
  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rota = await rotaService.buscarPorId(id);

      return res.json({
        status: 'success',
        data: rota
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Erro ao buscar rota'
      });
    }
  }

  // ========================================
  // ATUALIZAR ROTA
  // ========================================
  
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rota = await rotaService.atualizar(id, req.body);

      return res.json({
        status: 'success',
        message: 'Rota atualizada com sucesso',
        data: rota
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Erro ao atualizar rota'
      });
    }
  }

  // ========================================
  // CANCELAR ROTA
  // ========================================
  
  async cancelar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { motivo, valorCancelamento } = req.body;

      if (!motivo) {
        return res.status(400).json({
          status: 'error',
          message: 'Motivo do cancelamento é obrigatório'
        });
      }

      const rota = await rotaService.cancelar(id, motivo, valorCancelamento);

      return res.json({
        status: 'success',
        message: 'Rota cancelada com sucesso',
        data: rota
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Erro ao cancelar rota'
      });
    }
  }

  // ========================================
  // EXCLUIR ROTA
  // ========================================
  
  async excluir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await rotaService.excluir(id);

      return res.json({
        status: 'success',
        message: resultado.message
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Erro ao excluir rota'
      });
    }
  }

  // ========================================
  // OBTER TABELA DE PREÇOS
  // ========================================
  
  async obterTabelaPrecos(req: Request, res: Response) {
    try {
      const tabela = rotaService.obterTabelaPrecos();

      return res.json({
        status: 'success',
        data: tabela
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Erro ao obter tabela de preços'
      });
    }
  }

  // ========================================
  // CRIAR OFERTA PARA MOTORISTA (Alocação D-1)
  // ========================================

  async criarOfertaParaMotorista(req: Request, res: Response) {
    try {
      const { rotaId, motoristaId } = req.body;

      if (!rotaId || !motoristaId) {
        return res.status(400).json({
          status: 'error',
          message: 'rotaId e motoristaId são obrigatórios'
        });
      }

      const rota = await prisma.rota.findUnique({
        where: { id: rotaId },
        select: { status: true },
      });

      if (!rota) {
        return res.status(404).json({
          status: 'error',
          message: 'Rota não encontrada',
        });
      }

      const statusPermitidos = new Set<StatusRota>([
        StatusRota.DISPONIVEL,
        StatusRota.RECUSADA,
        StatusRota.OFERTADA,
      ]);

      if (!statusPermitidos.has(rota.status as StatusRota)) {
        return res.status(400).json({
          status: 'error',
          message: 'A rota selecionada não está disponível para oferta',
        });
      }

      const ofertaExistente = await prisma.ofertaRota.findFirst({
        where: {
          rotaId,
          motoristaId,
          status: StatusOferta.PENDENTE,
        },
      });

      let oferta;
      if (ofertaExistente) {
        oferta = await prisma.ofertaRota.update({
          where: { id: ofertaExistente.id },
          data: {
            dataEnvio: new Date(),
          },
        });
      } else {
        oferta = await prisma.ofertaRota.create({
          data: {
            rotaId,
            motoristaId,
            status: StatusOferta.PENDENTE,
            dataEnvio: new Date(),
          },
        });
      }

      // Criar oferta
      // Atualizar status da rota para OFERTADA
      await prisma.rota.update({
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

      // TODO: Enviar notificação Push para o motorista

      return res.status(201).json({
        status: 'success',
        message: 'Oferta criada com sucesso',
        data: oferta
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Erro ao criar oferta'
      });
    }
  }

  // ========================================
  // LISTAR OFERTAS (MOTORISTA)
  // ========================================

  async listarOfertas(req: Request, res: Response) {
    try {
      const motoristaId = await this.obterMotoristaIdPorUsuario(req);
      console.debug('[RotaController] Listando ofertas para motorista', { motoristaId });

      const ofertas = await prisma.ofertaRota.findMany({
        where: {
          motoristaId,
          status: StatusOferta.PENDENTE,
        },
        include: {
          rota: {
            include: {
              local: true,
              motorista: true,
            },
          },
        },
        orderBy: {
          dataEnvio: 'desc',
        },
      });

      return res.json({
        status: 'success',
        data: {
          ofertas,
          total: ofertas.length
        }
      });
    } catch (error: any) {
      console.error('[RotaController] Erro ao listar ofertas', error);
      const status = error instanceof AppError ? error.statusCode : 500;
      return res.status(status).json({
        status: 'error',
        message: error.message || 'Erro ao listar ofertas'
      });
    }
  }

  // ========================================
  // ACEITAR OFERTA (MOTORISTA)
  // ========================================

  async aceitarOferta(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const motoristaId = await this.obterMotoristaIdPorUsuario(req);
      console.debug('[RotaController] Motorista aceitando oferta', { ofertaId: id, motoristaId });
      const {
        adicionouAgenda,
        latitude,
        longitude,
        dispositivo,
        ip
      } = req.body;

      // Buscar oferta
      const oferta = await prisma.ofertaRota.findUnique({
        where: { id },
        include: {
          rota: true
        }
      });

      if (!oferta) {
        return res.status(404).json({
          status: 'error',
          message: 'Oferta não encontrada'
        });
      }

      if (oferta.motoristaId !== motoristaId) {
        return res.status(403).json({
          status: 'error',
          message: 'Oferta não pertence ao motorista autenticado'
        });
      }

      if (oferta.status !== StatusOferta.PENDENTE) {
        return res.status(400).json({
          status: 'error',
          message: 'Oferta não está mais disponível'
        });
      }

      // Atualizar oferta
      const ofertaAtualizada = await prisma.ofertaRota.update({
        where: { id },
        data: {
          status: StatusOferta.ACEITA,
          dataResposta: new Date(),
          adicionouAgenda: adicionouAgenda || false,
          latitudeResposta: latitude,
          longitudeResposta: longitude,
          dispositivoResposta: dispositivo,
          ipResposta: ip,
        },
      });

      // Atualizar status da rota para ACEITA
      await prisma.rota.update({
        where: { id: oferta.rotaId },
        data: {
          status: StatusRota.ACEITA,
          motoristaId: motoristaId,
          statusTracking: StatusTracking.AGUARDANDO,
          timestampACaminho: null,
          timestampNoLocal: null,
          timestampRotaIniciada: null,
          timestampRotaConcluida: null,
          horaInicioReal: null,
          horaFimReal: null,
        },
      });

      // Expirar outras ofertas da mesma rota
      await prisma.ofertaRota.updateMany({
        where: {
          rotaId: oferta.rotaId,
          id: { not: id },
          status: StatusOferta.PENDENTE,
        },
        data: {
          status: StatusOferta.EXPIRADA,
        },
      });

      return res.json({
        status: 'success',
        message: 'Oferta aceita com sucesso',
        data: ofertaAtualizada
      });
    } catch (error: any) {
      console.error('[RotaController] Erro ao aceitar oferta', { ofertaId: req.params.id, error });
      const status = error instanceof AppError ? error.statusCode : 500;
      return res.status(status).json({
        status: 'error',
        message: error.message || 'Erro ao aceitar oferta'
      });
    }
  }

  // ========================================
  // RECUSAR OFERTA (MOTORISTA)
  // ========================================

  async recusarOferta(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const motoristaId = await this.obterMotoristaIdPorUsuario(req);
      console.debug('[RotaController] Motorista recusando oferta', { ofertaId: id, motoristaId });
      const {
        motivo,
        latitude,
        longitude,
        dispositivo,
        ip
      } = req.body;

      if (!motivo) {
        return res.status(400).json({
          status: 'error',
          message: 'Motivo da recusa é obrigatório'
        });
      }

      // Buscar oferta
      const oferta = await prisma.ofertaRota.findUnique({
        where: { id },
      });

      if (!oferta) {
        return res.status(404).json({
          status: 'error',
          message: 'Oferta não encontrada'
        });
      }

      if (oferta.motoristaId !== motoristaId) {
        return res.status(403).json({
          status: 'error',
          message: 'Oferta não pertence ao motorista autenticado'
        });
      }

      if (oferta.status !== StatusOferta.PENDENTE) {
        return res.status(400).json({
          status: 'error',
          message: 'Oferta não está mais disponível'
        });
      }

      // Atualizar oferta
      const ofertaAtualizada = await prisma.ofertaRota.update({
        where: { id },
        data: {
          status: StatusOferta.RECUSADA,
          dataResposta: new Date(),
          motivoRecusa: motivo,
          latitudeResposta: latitude,
          longitudeResposta: longitude,
          dispositivoResposta: dispositivo,
          ipResposta: ip,
        },
      });

      // Atualizar status da rota de volta para DISPONIVEL
      await prisma.rota.update({
        where: { id: oferta.rotaId },
        data: {
          status: StatusRota.RECUSADA,
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

      return res.json({
        status: 'success',
        message: 'Oferta recusada',
        data: ofertaAtualizada
      });
    } catch (error: any) {
      console.error('[RotaController] Erro ao recusar oferta', { ofertaId: req.params.id, error });
      const status = error instanceof AppError ? error.statusCode : 500;
      return res.status(status).json({
        status: 'error',
        message: error.message || 'Erro ao recusar oferta'
      });
    }
  }

  // ========================================
  // ATUALIZAR TRACKING (MOTORISTA)
  // ========================================

  async atualizarTracking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const motoristaId = await this.obterMotoristaIdPorUsuario(req);
      console.debug('[RotaController] Atualizando tracking da rota', { rotaId: id, motoristaId });
      const {
        statusTracking,
        latitude,
        longitude,
        observacao,
        insucessos,
        quantidadePNOV,
        satisfacaoMotorista,
        satisfacao,
        feedbackMotorista,
        feedback,
        dispositivo,
        ip: ipBody,
      } = req.body;

      if (!statusTracking) {
        return res.status(400).json({
          status: 'error',
          message: 'Status de tracking é obrigatório'
        });
      }

      const statusValidos = Object.values(StatusTracking);
      if (!statusValidos.includes(statusTracking as StatusTracking)) {
        return res.status(400).json({
          status: 'error',
          message: 'Status de tracking inválido',
          statusValidos
        });
      }

      const parseOptionalNumber = (valor: any): number | undefined => {
        if (valor === undefined || valor === null || valor === '') return undefined;
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : undefined;
      };

      const latitudeNumero = parseOptionalNumber(latitude);
      const longitudeNumero = parseOptionalNumber(longitude);
      const insucessosNumero = parseOptionalNumber(insucessos);
      const quantidadePNOVNumero = parseOptionalNumber(quantidadePNOV);

      const forwardedIpHeader = req.headers['x-forwarded-for'];
      const ipCabecalho = Array.isArray(forwardedIpHeader)
        ? forwardedIpHeader[0]
        : forwardedIpHeader;
      const ipDerivado = typeof ipCabecalho === 'string' && ipCabecalho.length > 0
        ? ipCabecalho.split(',')[0].trim()
        : undefined;
      const ip = ipBody || ipDerivado || req.ip;

      const dispositivoHeader = typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined;

      const rotaAtualizada = await rotaService.atualizarTracking({
        rotaId: id,
        motoristaId,
        novoStatus: statusTracking as StatusTracking,
        latitude: latitudeNumero,
        longitude: longitudeNumero,
        observacao,
        dispositivo: dispositivo || dispositivoHeader || null,
        ip,
        insucessos: insucessosNumero,
        quantidadePNOV: quantidadePNOVNumero,
        satisfacaoMotorista: satisfacaoMotorista || satisfacao || undefined,
        feedbackMotorista: feedbackMotorista || feedback || undefined,
      });

      return res.json({
        status: 'success',
        message: 'Status de tracking atualizado com sucesso',
        data: rotaAtualizada
      });
    } catch (error: any) {
      console.error('[RotaController] Erro ao atualizar tracking', { rotaId: req.params.id, error });
      const status = error instanceof AppError ? error.statusCode : 500;
      return res.status(status).json({
        status: 'error',
        message: error.message || 'Erro ao atualizar tracking'
      });
    }
  }
}

export default new RotaController();
