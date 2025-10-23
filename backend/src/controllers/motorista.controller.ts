// backend/src/controllers/motorista.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

class MotoristaController {
  /**
   * Listar motoristas com relacionamentos
   */
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, tipoVeiculo, cidade, uf, nivel, busca, page = '1', limit = '50' } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const where: any = {};

      if (status) where.status = status;
      if (tipoVeiculo) where.tipoVeiculo = tipoVeiculo;
      if (cidade) where.cidade = cidade;
      if (uf) where.uf = uf;
      if (nivel) where.nivel = nivel;

      if (busca) {
        where.OR = [
          { nomeCompleto: { contains: busca as string, mode: 'insensitive' } },
          { cpf: { contains: busca as string } },
          { celular: { contains: busca as string } },
          { email: { contains: busca as string } }
        ];
      }

      const [motoristas, total] = await Promise.all([
        prisma.motorista.findMany({
          where,
          skip,
          take,
          include: {
            usuario: { select: { email: true, perfil: true } },
            documento: true,
            contratos: { where: { ativo: true }, take: 1, orderBy: { createdAt: 'desc' } }
          },
          orderBy: [{ pontuacao: 'desc' }, { nomeCompleto: 'asc' }]
        }),
        prisma.motorista.count({ where })
      ]);

      res.json({
        success: true,
        data: { motoristas, total },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar motorista por ID
   */
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const motorista = await prisma.motorista.findUnique({
        where: { id },
        include: {
          usuario: { select: { email: true, perfil: true } },
          documento: true,
          contratos: { where: { ativo: true }, orderBy: { createdAt: 'desc' } }
        }
      });

      if (!motorista) {
        throw new AppError('Motorista não encontrado', 404);
      }

      res.json({ success: true, data: motorista });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar motorista com documentos e contrato
   */
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const dados = req.body;

      // Verificar duplicatas
      if (dados.cpf) {
        const cpfExiste = await prisma.motorista.findUnique({ where: { cpf: dados.cpf } });
        if (cpfExiste) throw new AppError('CPF já cadastrado', 400);
      }

      if (dados.email) {
        const emailExiste = await prisma.usuario.findUnique({ where: { email: dados.email } });
        if (emailExiste) throw new AppError('Email já cadastrado', 400);
      }

      // Criar em transação
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Criar usuário
        const usuario = await tx.usuario.create({
          data: {
            email: dados.email,
            senha: dados.senha, // TODO: Hash
            perfil: 'MOTORISTA',
            nome: dados.nomeCompleto
          }
        });

        // 2. Criar motorista
        const motorista = await tx.motorista.create({
          data: {
            usuarioId: usuario.id,
            transporterId: dados.transporterId,
            nomeCompleto: dados.nomeCompleto,
            cpf: dados.cpf,
            dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
            celular: dados.celular,
            email: dados.email,
            chavePix: dados.chavePix,
            cep: dados.cep,
            logradouro: dados.logradouro,
            numero: dados.numero,
            complemento: dados.complemento,
            bairro: dados.bairro,
            cidade: dados.cidade,
            uf: dados.uf,
            tipoVeiculo: dados.tipoVeiculo,
            placaVeiculo: dados.placaVeiculo,
            anoFabricacaoVeiculo: dados.anoFabricacaoVeiculo,
            propriedadeVeiculo: dados.propriedadeVeiculo || 'PROPRIO',
            status: dados.status || 'ONBOARDING',
            pontuacao: 0,
            nivel: 'INICIANTE'
          }
        });

        // 3. Criar documentos
        if (dados.numeroCNH || dados.validadeCNH || dados.dataVerificacaoBRK) {
          await tx.documento.create({
            data: {
              motoristaId: motorista.id,
              numeroCNH: dados.numeroCNH,
              validadeCNH: dados.validadeCNH ? new Date(dados.validadeCNH) : undefined,
              anoLicenciamento: dados.anoLicenciamento,
              dataVerificacaoBRK: dados.dataVerificacaoBRK ? new Date(dados.dataVerificacaoBRK) : undefined,
              proximaVerificacaoBRK: dados.proximaVerificacaoBRK ? new Date(dados.proximaVerificacaoBRK) : undefined,
              statusBRK: dados.statusBRK || false
            }
          });
        }

        // 4. Criar contrato MEI
        if (dados.cnpjMEI || dados.razaoSocialMEI || dados.numeroContrato) {
          await tx.contratos.create({
            data: {
              motoristaId: motorista.id,
              numeroContrato: dados.numeroContrato || `CONTRATO-${Date.now()}`,
              dataAssinatura: dados.dataAssinatura ? new Date(dados.dataAssinatura) : new Date(),
              dataVigenciaInicial: dados.dataVigenciaInicial ? new Date(dados.dataVigenciaInicial) : new Date(),
              cnpjMEI: dados.cnpjMEI,
              razaoSocialMEI: dados.razaoSocialMEI,
              ativo: true
            }
          });
        }

        return motorista;
      });

      res.status(201).json({
        success: true,
        data: resultado,
        message: 'Motorista criado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar motorista com documentos e contrato
   */
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dados = req.body;

      const motoristaExiste = await prisma.motorista.findUnique({ where: { id } });
      if (!motoristaExiste) throw new AppError('Motorista não encontrado', 404);

      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Atualizar motorista
        const motorista = await tx.motorista.update({
          where: { id },
          data: {
            transporterId: dados.transporterId,
            nomeCompleto: dados.nomeCompleto,
            dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : undefined,
            celular: dados.celular,
            email: dados.email,
            chavePix: dados.chavePix,
            cep: dados.cep,
            logradouro: dados.logradouro,
            numero: dados.numero,
            complemento: dados.complemento,
            bairro: dados.bairro,
            cidade: dados.cidade,
            uf: dados.uf,
            tipoVeiculo: dados.tipoVeiculo,
            placaVeiculo: dados.placaVeiculo,
            anoFabricacaoVeiculo: dados.anoFabricacaoVeiculo,
            propriedadeVeiculo: dados.propriedadeVeiculo
          }
        });

        // 2. Atualizar/Criar documentos
        const documentoExiste = await tx.documento.findUnique({ where: { motoristaId: id } });

        if (documentoExiste) {
          await tx.documento.update({
            where: { motoristaId: id },
            data: {
              numeroCNH: dados.numeroCNH,
              validadeCNH: dados.validadeCNH ? new Date(dados.validadeCNH) : undefined,
              anoLicenciamento: dados.anoLicenciamento,
              dataVerificacaoBRK: dados.dataVerificacaoBRK ? new Date(dados.dataVerificacaoBRK) : undefined,
              proximaVerificacaoBRK: dados.proximaVerificacaoBRK ? new Date(dados.proximaVerificacaoBRK) : undefined,
              statusBRK: dados.statusBRK
            }
          });
        } else if (dados.numeroCNH || dados.validadeCNH || dados.dataVerificacaoBRK) {
          await tx.documento.create({
            data: {
              motoristaId: id,
              numeroCNH: dados.numeroCNH,
              validadeCNH: dados.validadeCNH ? new Date(dados.validadeCNH) : undefined,
              anoLicenciamento: dados.anoLicenciamento,
              dataVerificacaoBRK: dados.dataVerificacaoBRK ? new Date(dados.dataVerificacaoBRK) : undefined,
              proximaVerificacaoBRK: dados.proximaVerificacaoBRK ? new Date(dados.proximaVerificacaoBRK) : undefined,
              statusBRK: dados.statusBRK || false
            }
          });
        }

        // 3. Atualizar contrato ativo ou criar novo
        if (dados.cnpjMEI || dados.razaoSocialMEI || dados.numeroContrato) {
          const contratoAtivo = await tx.contratos.findFirst({
            where: { motoristaId: id, ativo: true },
            orderBy: { createdAt: 'desc' }
          });

          if (contratoAtivo) {
            // Atualizar contrato existente
            await tx.contratos.update({
              where: { id: contratoAtivo.id },
              data: {
                numeroContrato: dados.numeroContrato || contratoAtivo.numeroContrato,
                dataAssinatura: dados.dataAssinatura ? new Date(dados.dataAssinatura) : contratoAtivo.dataAssinatura,
                dataVigenciaInicial: dados.dataVigenciaInicial ? new Date(dados.dataVigenciaInicial) : contratoAtivo.dataVigenciaInicial,
                cnpjMEI: dados.cnpjMEI,
                razaoSocialMEI: dados.razaoSocialMEI
              }
            });
          } else {
            // Criar novo contrato
            await tx.contratos.create({
              data: {
                motoristaId: id,
                numeroContrato: dados.numeroContrato || `CONTRATO-${Date.now()}`,
                dataAssinatura: dados.dataAssinatura ? new Date(dados.dataAssinatura) : new Date(),
                dataVigenciaInicial: dados.dataVigenciaInicial ? new Date(dados.dataVigenciaInicial) : new Date(),
                cnpjMEI: dados.cnpjMEI,
                razaoSocialMEI: dados.razaoSocialMEI,
                ativo: true
              }
            });
          }
        }

        return motorista;
      });

      res.json({
        success: true,
        data: resultado,
        message: 'Motorista atualizado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir motorista (soft delete)
   */
  async excluir(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const motoristaExiste = await prisma.motorista.findUnique({ where: { id } });
      if (!motoristaExiste) throw new AppError('Motorista não encontrado', 404);

      await prisma.motorista.update({
        where: { id },
        data: { status: 'INATIVO' }
      });

      res.json({ success: true, message: 'Motorista desativado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mudar status do motorista
   */
  async mudarStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) throw new AppError('Status é obrigatório', 400);

      const motorista = await prisma.motorista.update({
        where: { id },
        data: { status }
      });

      res.json({
        success: true,
        data: motorista,
        message: 'Status atualizado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar elegibilidade do motorista
   */
  async verificarElegibilidade(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const motorista = await prisma.motorista.findUnique({
        where: { id },
        include: {
          documento: true,
          contratos: { where: { ativo: true }, take: 1 }
        }
      });

      if (!motorista) throw new AppError('Motorista não encontrado', 404);

      const problemas: string[] = [];
      const hoje = new Date();

      // Verificações
      if (motorista.status !== 'ATIVO') problemas.push('Status não está ATIVO');
      if (!motorista.documento?.numeroCNH) problemas.push('CNH não cadastrada');
      if (motorista.documento?.validadeCNH && motorista.documento.validadeCNH < hoje) {
        problemas.push('CNH vencida');
      }
      if (!motorista.documento?.statusBRK) problemas.push('BRK não aprovado');
      if (!motorista.contratos?.[0]?.cnpjMEI) problemas.push('CNPJ MEI não cadastrado');
      if (!motorista.tipoVeiculo) problemas.push('Tipo de veículo não cadastrado');

      const elegivel = problemas.length === 0;

      res.json({
        success: true,
        data: {
          elegivel,
          problemas,
          motorista: {
            id: motorista.id,
            nomeCompleto: motorista.nomeCompleto,
            status: motorista.status,
            nivel: motorista.nivel,
            pontuacao: motorista.pontuacao
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MotoristaController();
