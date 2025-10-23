import { Request, Response, NextFunction } from 'express';
import precoService from '../services/preco.service';
import { AppError } from '../middlewares/error.middleware';
import { TipoVeiculo, TipoPropriedadeVeiculo } from '@prisma/client';

class PrecoController {
  // POST /api/precos
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        tipoVeiculo,
        propriedadeVeiculo,
        valorHora,
        valorCancelamentoHora,
        valorKm,
        dataInicioVigencia,
        dataFimVigencia
      } = req.body;

      // Validações
      if (!tipoVeiculo || !propriedadeVeiculo || !valorHora || !valorCancelamentoHora || !valorKm || !dataInicioVigencia) {
        throw new AppError('Todos os campos obrigatórios devem ser preenchidos', 400);
      }

      const tabela = await precoService.criar({
        tipoVeiculo: tipoVeiculo as TipoVeiculo,
        propriedadeVeiculo: propriedadeVeiculo as TipoPropriedadeVeiculo,
        valorHora: Number(valorHora),
        valorCancelamentoHora: Number(valorCancelamentoHora),
        valorKm: Number(valorKm),
        dataInicioVigencia: new Date(dataInicioVigencia),
        dataFimVigencia: dataFimVigencia ? new Date(dataFimVigencia) : undefined
      });

      res.status(201).json({
        status: 'success',
        message: 'Tabela de preços criada com sucesso',
        data: { tabela }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/precos
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipoVeiculo, propriedadeVeiculo, ativo } = req.query;

      const filtros = {
        tipoVeiculo: tipoVeiculo as TipoVeiculo,
        propriedadeVeiculo: propriedadeVeiculo as TipoPropriedadeVeiculo,
        ativo: ativo !== undefined ? ativo === 'true' : undefined
      };

      const tabelas = await precoService.listar(filtros);

      res.json({
        status: 'success',
        data: {
          tabelas,
          total: tabelas.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/precos/ativo/:tipoVeiculo/:propriedadeVeiculo
  async buscarAtiva(req: Request, res: Response, next: NextFunction) {
    try {
      const { tipoVeiculo, propriedadeVeiculo } = req.params;

      const tabela = await precoService.buscarAtiva(
        tipoVeiculo as TipoVeiculo,
        propriedadeVeiculo as TipoPropriedadeVeiculo
      );

      res.json({
        status: 'success',
        data: { tabela }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/precos/:id
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tabela = await precoService.buscarPorId(id);

      res.json({
        status: 'success',
        data: { tabela }
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/precos/:id
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        valorHora,
        valorCancelamentoHora,
        valorKm,
        dataFimVigencia
      } = req.body;

      const dados: any = {};

      if (valorHora) dados.valorHora = Number(valorHora);
      if (valorCancelamentoHora) dados.valorCancelamentoHora = Number(valorCancelamentoHora);
      if (valorKm) dados.valorKm = Number(valorKm);
      if (dataFimVigencia) dados.dataFimVigencia = new Date(dataFimVigencia);

      const tabela = await precoService.atualizar(id, dados);

      res.json({
        status: 'success',
        message: 'Tabela de preços atualizada com sucesso',
        data: { tabela }
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/precos/:id/desativar
  async desativar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tabela = await precoService.desativar(id);

      res.json({
        status: 'success',
        message: 'Tabela de preços desativada com sucesso',
        data: { tabela }
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/precos/seed
  async criarTabelasPadrao(req: Request, res: Response, next: NextFunction) {
    try {
      const tabelas = await precoService.criarTabelasPadrao();

      res.status(201).json({
        status: 'success',
        message: 'Tabelas de preços padrão criadas com sucesso',
        data: {
          tabelas,
          total: tabelas.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PrecoController();
