import { Request, Response } from 'express';
import rotaService from '../services/rota.service';
import { TipoVeiculo, TipoRota, CicloRota, StatusRota } from '@prisma/client';
import prisma from '../config/database';

class RotaController {
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
      const filtros = {
        status: req.query.status as StatusRota,
        cicloRota: req.query.cicloRota as CicloRota,
        tipoVeiculo: req.query.tipoVeiculo as TipoVeiculo,
        tipoRota: req.query.tipoRota as TipoRota,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
        motoristaId: req.query.motoristaId as string,
      };

      const rotas = await rotaService.listar(filtros);

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

      // Criar oferta
      const oferta = await prisma.ofertaRota.create({
        data: {
          rotaId,
          motoristaId,
          status: 'PENDENTE',
          dataEnvio: new Date(),
        },
      });

      // Atualizar status da rota para OFERTADA
      await prisma.rota.update({
        where: { id: rotaId },
        data: { status: 'OFERTADA' },
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
}

export default new RotaController();