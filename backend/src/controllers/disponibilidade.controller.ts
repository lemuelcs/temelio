// backend/src/controllers/disponibilidade.controller.ts
// ✅ CORRIGIDO: Usa CicloRota em vez de TurnoDisponibilidade

import { Request, Response, NextFunction } from 'express';
import disponibilidadeService from '../services/disponibilidade.service';
import { CicloRota, TipoVeiculo } from '@prisma/client';

class DisponibilidadeController {
  /**
   * Cadastrar disponibilidade individual
   */
  async cadastrar(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar motorista pelo usuário logado
      const userId = req.user!.id;
      
      const motorista = await (await import('../config/database')).default.motorista.findFirst({
        where: { usuarioId: userId }
      });

      if (!motorista) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado para este usuário'
        });
      }

      const motoristaId = motorista.id;
      const { data, ciclo, disponivel } = req.body;

      const resultado = await disponibilidadeService.cadastrar({
        motoristaId,
        disponibilidades: [{
          data: new Date(data),
          ciclo: ciclo as CicloRota,
          disponivel
        }],
        alteradoPor: req.user!.id
      });

      res.status(201).json({
        success: true,
        data: resultado[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cadastrar disponibilidades em lote (batch)
   */
  async cadastrarBatch(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar motorista pelo usuário logado
      const userId = req.user!.id;
      
      const motorista = await (await import('../config/database')).default.motorista.findFirst({
        where: { usuarioId: userId }
      });

      if (!motorista) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado para este usuário'
        });
      }

      const motoristaId = motorista.id;
      const { disponibilidades } = req.body;

      // Validar estrutura
      if (!Array.isArray(disponibilidades) || disponibilidades.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Disponibilidades deve ser um array não vazio'
        });
      }

      // Converter datas
      const disponibilidadesFormatadas = disponibilidades.map(d => ({
        data: new Date(d.data),
        ciclo: d.ciclo as CicloRota,
        disponivel: d.disponivel
      }));

      const resultado = await disponibilidadeService.cadastrar({
        motoristaId,
        disponibilidades: disponibilidadesFormatadas,
        alteradoPor: req.user!.id,
        motivoAlteracao: 'Atualização em lote'
      });

      res.status(201).json({
        success: true,
        data: resultado,
        message: `${resultado.length} disponibilidade(s) processada(s) com sucesso`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar disponibilidades do motorista logado
   */
  async minhasDisponibilidades(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar motorista pelo usuário logado
      const userId = req.user!.id;
      
      const motorista = await (await import('../config/database')).default.motorista.findFirst({
        where: { usuarioId: userId }
      });

      if (!motorista) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado para este usuário'
        });
      }

      const motoristaId = motorista.id;
      const { dataInicio, dataFim, disponivel } = req.query;

      const filtros: any = {};
      
      if (dataInicio) filtros.dataInicio = new Date(dataInicio as string);
      if (dataFim) filtros.dataFim = new Date(dataFim as string);
      if (disponivel !== undefined) filtros.disponivel = disponivel === 'true';

      const disponibilidades = await disponibilidadeService.buscarPorMotorista(
        motoristaId,
        filtros
      );

      res.json({
        success: true,
        data: disponibilidades
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar semana corrente + próxima semana estruturado
   */
  async buscarSemanas(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar motorista pelo usuário logado
      const userId = req.user!.id;
      
      const motorista = await (await import('../config/database')).default.motorista.findFirst({
        where: { usuarioId: userId }
      });

      if (!motorista) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado para este usuário'
        });
      }

      const motoristaId = motorista.id;

      const semanas = await disponibilidadeService.buscarSemanasAtual(motoristaId);

      res.json({
        success: true,
        data: semanas
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar histórico de alterações
   */
  async buscarHistorico(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar motorista pelo usuário logado
      const userId = req.user!.id;
      
      const motorista = await (await import('../config/database')).default.motorista.findFirst({
        where: { usuarioId: userId }
      });

      if (!motorista) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado para este usuário'
        });
      }

      const motoristaId = motorista.id;
      const { dataInicio, dataFim } = req.query;

      const historico = await disponibilidadeService.buscarHistorico(
        motoristaId,
        dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim ? new Date(dataFim as string) : undefined
      );

      res.json({
        success: true,
        data: { historico }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar uma disponibilidade específica
   */
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar motorista pelo usuário logado
      const userId = req.user!.id;
      
      const motorista = await (await import('../config/database')).default.motorista.findFirst({
        where: { usuarioId: userId }
      });

      if (!motorista) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado para este usuário'
        });
      }

      const motoristaId = motorista.id;
      const { id } = req.params;
      const { disponivel } = req.body;

      const atualizada = await disponibilidadeService.atualizar(
        motoristaId,
        id,
        { disponivel },
        req.user!.id
      );

      res.json({
        success: true,
        data: atualizada
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir uma disponibilidade
   */
  async excluir(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar motorista pelo usuário logado
      const userId = req.user!.id;
      
      const motorista = await (await import('../config/database')).default.motorista.findFirst({
        where: { usuarioId: userId }
      });

      if (!motorista) {
        return res.status(404).json({
          success: false,
          message: 'Motorista não encontrado para este usuário'
        });
      }

      const motoristaId = motorista.id;
      const { id } = req.params;

      const resultado = await disponibilidadeService.excluir(motoristaId, id);

      res.json({
        success: true,
        message: resultado.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GESTÃO: Buscar disponibilidades de um motorista específico
   */
  async buscarPorMotorista(req: Request, res: Response, next: NextFunction) {
    try {
      const { motoristaId } = req.params;
      const { dataInicio, dataFim, disponivel } = req.query;

      const filtros: any = {};
      
      if (dataInicio) filtros.dataInicio = new Date(dataInicio as string);
      if (dataFim) filtros.dataFim = new Date(dataFim as string);
      if (disponivel !== undefined) filtros.disponivel = disponivel === 'true';

      const disponibilidades = await disponibilidadeService.buscarPorMotorista(
        motoristaId,
        filtros
      );

      res.json({
        success: true,
        data: disponibilidades
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GESTÃO: Buscar motoristas disponíveis para data/ciclo
   */
  async buscarMotoristasDisponiveis(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, ciclo, tipoVeiculo, cidade } = req.body;

      if (!data || !ciclo) {
        return res.status(400).json({
          success: false,
          message: 'Data e ciclo são obrigatórios'
        });
      }

      const motoristas = await disponibilidadeService.buscarMotoristasDisponiveis(
        new Date(data),
        ciclo as CicloRota,
        {
          tipoVeiculo: tipoVeiculo as TipoVeiculo,
          cidade
        }
      );

      res.json({
        success: true,
        data: { motoristas }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GESTÃO: Buscar resumo consolidado por tipo de veículo
   */
  async buscarResumo(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          success: false,
          message: 'dataInicio e dataFim são obrigatórios'
        });
      }

      const resumo = await disponibilidadeService.buscarResumo(
        new Date(dataInicio as string),
        new Date(dataFim as string)
      );

      res.json({
        success: true,
        data: { resumo }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GESTÃO: Listar TODAS as disponibilidades com filtros
   */
  async listarTodas(req: Request, res: Response, next: NextFunction) {
    try {
      const { dataInicio, dataFim, motoristaId, ciclo, disponivel } = req.query;

      const filtros: any = {};
      
      if (dataInicio) filtros.dataInicio = new Date(dataInicio as string);
      if (dataFim) filtros.dataFim = new Date(dataFim as string);
      if (disponivel !== undefined) filtros.disponivel = disponivel === 'true';

      // Se motoristaId for fornecido, buscar apenas desse motorista
      if (motoristaId) {
        const disponibilidades = await disponibilidadeService.buscarPorMotorista(
          motoristaId as string,
          filtros
        );

        return res.json({
          success: true,
          data: disponibilidades
        });
      }

      // Caso contrário, retornar erro informativo
      return res.status(400).json({
        success: false,
        message: 'Para listar todas, utilize o endpoint /resumo com filtros de data'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DisponibilidadeController();
