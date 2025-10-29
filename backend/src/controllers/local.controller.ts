import { Request, Response, NextFunction } from 'express';
import localService from '../services/local.service';
import { AppError } from '../middlewares/error.middleware';

class LocalController {
  // Helper: Remove formatação do CEP (mantém apenas números)
  private limparCEP(cep: string): string {
    return cep.replace(/\D/g, '');
  }
  // POST /api/locais
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const { codigo, nome, endereco, cep, latitude, longitude, cidade, uf } = req.body;

      // Validações
      if (!codigo || !nome || !endereco || !latitude || !longitude || !cidade || !uf) {
        throw new AppError('Todos os campos são obrigatórios', 400);
      }

      if (uf.length !== 2) {
        throw new AppError('UF deve ter 2 caracteres', 400);
      }

      const local = await localService.criar({
        codigo,
        nome,
        endereco,
        cep: cep ? this.limparCEP(cep) : cep,
        latitude: Number(latitude),
        longitude: Number(longitude),
        cidade,
        uf
      });

      res.status(201).json({
        status: 'success',
        message: 'Local criado com sucesso',
        data: { local }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/locais
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { ativo, cidade, uf } = req.query;

      const filtros = {
        ativo: ativo !== undefined ? ativo === 'true' : undefined,
        cidade: cidade as string,
        uf: uf as string
      };

      const locais = await localService.listar(filtros);

      res.json({
        status: 'success',
        data: {
          locais,
          total: locais.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/locais/:id
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const local = await localService.buscarPorId(id);

      res.json({
        status: 'success',
        data: { local }
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/locais/:id
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { nome, endereco, cep, latitude, longitude, cidade, uf } = req.body;

      const dados: any = {};

      // Nota: código não pode ser atualizado pois é UNIQUE e serve como identificador
      if (nome !== undefined) dados.nome = nome;
      if (endereco !== undefined) dados.endereco = endereco;
      if (cep !== undefined) dados.cep = this.limparCEP(cep);
      // Prisma converte automaticamente para Decimal, não precisa converter para Number
      if (latitude !== undefined) dados.latitude = latitude;
      if (longitude !== undefined) dados.longitude = longitude;
      if (cidade !== undefined) dados.cidade = cidade;
      if (uf !== undefined) {
        if (uf.length !== 2) {
          throw new AppError('UF deve ter 2 caracteres', 400);
        }
        dados.uf = uf;
      }

      const local = await localService.atualizar(id, dados);

      res.json({
        status: 'success',
        message: 'Local atualizado com sucesso',
        data: { local }
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/locais/:id/status
  async mudarStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      if (typeof ativo !== 'boolean') {
        throw new AppError('Campo "ativo" é obrigatório e deve ser boolean', 400);
      }

      const local = await localService.mudarStatus(id, ativo);

      res.json({
        status: 'success',
        message: `Local ${ativo ? 'ativado' : 'desativado'} com sucesso`,
        data: { local }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LocalController();