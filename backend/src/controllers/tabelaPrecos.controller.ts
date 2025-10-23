import { Request, Response } from 'express';
import tabelaPrecosService from '../services/tabelaPrecos.service';
import { TipoServico, TipoPropriedade } from '@prisma/client';

class TabelaPrecosController {
  // GET /api/tabela-precos
  async listar(req: Request, res: Response) {
    const { estacao, tipoServico, propriedade, ativo } = req.query;

    const filtros: any = {};

    if (estacao) filtros.estacao = estacao as string;
    if (tipoServico) filtros.tipoServico = tipoServico as TipoServico;
    if (propriedade) filtros.propriedade = propriedade as TipoPropriedade;
    if (ativo !== undefined) filtros.ativo = ativo === 'true';

    const tabelas = await tabelaPrecosService.listar(filtros);

    res.json({
      success: true,
      data: { tabelas }
    });
  }

  // GET /api/tabela-precos/vigente
  async buscarVigente(req: Request, res: Response) {
    const { estacao, tipoServico, propriedade } = req.query;

    if (!estacao || !tipoServico || !propriedade) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros obrigatórios: estacao, tipoServico, propriedade'
      });
    }

    const tabela = await tabelaPrecosService.buscarVigente(
      estacao as string,
      tipoServico as TipoServico,
      propriedade as TipoPropriedade
    );

    res.json({
      success: true,
      data: { tabela }
    });
  }

  // GET /api/tabela-precos/:id
  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const tabela = await tabelaPrecosService.buscarPorId(id);

    res.json({
      success: true,
      data: { tabela }
    });
  }

  // POST /api/tabela-precos
  async criar(req: Request, res: Response) {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const dados = {
      ...req.body,
      usuarioId
    };

    const novaTabela = await tabelaPrecosService.criar(dados);

    res.status(201).json({
      success: true,
      message: 'Tabela de preços criada com sucesso',
      data: { tabela: novaTabela }
    });
  }

  // PUT /api/tabela-precos/:id
  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const tabelaAtualizada = await tabelaPrecosService.atualizar(id, req.body, usuarioId);

    res.json({
      success: true,
      message: 'Tabela de preços atualizada com sucesso',
      data: { tabela: tabelaAtualizada }
    });
  }

  // PATCH /api/tabela-precos/:id/desativar
  async desativar(req: Request, res: Response) {
    const { id } = req.params;
    const tabelaDesativada = await tabelaPrecosService.desativar(id);

    res.json({
      success: true,
      message: 'Tabela de preços desativada com sucesso',
      data: { tabela: tabelaDesativada }
    });
  }

  // DELETE /api/tabela-precos/:id
  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    await tabelaPrecosService.deletar(id);

    res.json({
      success: true,
      message: 'Tabela de preços deletada com sucesso'
    });
  }

  // GET /api/tabela-precos/historico
  async listarHistorico(req: Request, res: Response) {
    const { estacao, tipoServico, propriedade } = req.query;

    if (!estacao || !tipoServico || !propriedade) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros obrigatórios: estacao, tipoServico, propriedade'
      });
    }

    const historico = await tabelaPrecosService.listarHistorico(
      estacao as string,
      tipoServico as TipoServico,
      propriedade as TipoPropriedade
    );

    res.json({
      success: true,
      data: { historico }
    });
  }
}

export default new TabelaPrecosController();