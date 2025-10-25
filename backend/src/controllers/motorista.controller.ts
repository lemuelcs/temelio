// backend/src/controllers/motorista.controller.ts
import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { TipoVeiculo, PropriedadeVeiculo, StatusMotorista } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import motoristaService from '../services/motorista.service';
import { enviarCredenciaisMotorista } from '../services/email.service';
import logger from '../lib/logger';

const SENHA_TEMPORARIA_PADRAO = process.env.MOTORISTA_SENHA_PADRAO ?? 'temelio123';

const toDateOrUndefined = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sanitizeString = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNumberOrNull = (value?: unknown) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

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
      const dados = req.body ?? {};

      const tipoVeiculo = (dados.tipoVeiculo || '').toString().toUpperCase() as TipoVeiculo;
      const propriedadeVeiculo = (
        dados.propriedadeVeiculo || 'PROPRIO'
      )
        .toString()
        .toUpperCase() as PropriedadeVeiculo;
      const statusMotorista = dados.status
        ? (dados.status as string).toString().toUpperCase() as StatusMotorista
        : undefined;

      const cadastroPayload = {
        transporterId: sanitizeString(dados.transporterId),
        nomeCompleto: dados.nomeCompleto,
        celular: (dados.celular || '').toString().replace(/\D/g, ''),
        cidade: dados.cidade,
        uf: dados.uf,
        bairro: sanitizeString(dados.bairro),
        cep: sanitizeString(dados.cep)?.replace(/\D/g, '') ?? null,
        logradouro: sanitizeString(dados.logradouro),
        numero: sanitizeString(dados.numero),
        complemento: sanitizeString(dados.complemento),
        cpf: (dados.cpf || '').toString().replace(/\D/g, ''),
        email: dados.email,
        chavePix: sanitizeString(dados.chavePix),
        tipoVeiculo,
        propriedadeVeiculo,
        senha: SENHA_TEMPORARIA_PADRAO,
        obrigarAlterarSenha: true,
        dataNascimento: toDateOrUndefined(dados.dataNascimento),
        anoFabricacaoVeiculo: toNumberOrNull(dados.anoFabricacaoVeiculo) ?? undefined,
        placaVeiculo: sanitizeString(dados.placaVeiculo),
        numeroCNH: sanitizeString(dados.numeroCNH),
        validadeCNH: toDateOrUndefined(dados.validadeCNH),
        anoLicenciamento: toNumberOrNull(dados.anoLicenciamento) ?? undefined,
        dataVerificacaoBRK: toDateOrUndefined(dados.dataVerificacaoBRK),
        proximaVerificacaoBRK: toDateOrUndefined(dados.proximaVerificacaoBRK),
        statusBRK:
          typeof dados.statusBRK === 'boolean'
            ? dados.statusBRK
            : dados.statusBRK === 'true'
              ? true
              : dados.statusBRK === 'false'
                ? false
                : undefined,
        status: statusMotorista,
        numeroContrato: sanitizeString(dados.numeroContrato) ?? undefined,
        dataAssinatura: toDateOrUndefined(dados.dataAssinatura),
        dataVigenciaInicial: toDateOrUndefined(dados.dataVigenciaInicial),
        cnpjMEI: sanitizeString(dados.cnpjMEI)?.replace(/\D/g, '') ?? undefined,
        razaoSocialMEI: sanitizeString(dados.razaoSocialMEI) ?? undefined,
      };

      const forwarded = req.headers['x-forwarded-for'];
      const forwardedIp = Array.isArray(forwarded)
        ? forwarded[0]
        : typeof forwarded === 'string'
          ? forwarded.split(',')[0]?.trim()
          : undefined;
      const resolvedIp = (typeof req.ip === 'string' && req.ip.length > 0 ? req.ip : undefined) ?? forwardedIp ?? 'unknown';

      const auditData = {
        usuarioId: req.user?.id ?? 'sistema',
        ip: resolvedIp,
        dispositivo:
          typeof req.headers['user-agent'] === 'string'
            ? req.headers['user-agent']
            : 'unknown',
      };

      const motorista = await motoristaService.criar(cadastroPayload, auditData);

      await enviarCredenciaisMotorista({
        nome: motorista.nomeCompleto,
        email: motorista.email,
        senhaTemporaria: SENHA_TEMPORARIA_PADRAO,
      });

      res.status(201).json({
        success: true,
        data: motorista,
        message: 'Motorista criado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  async baixarModeloImportacao(_req: Request, res: Response) {
    const cabecalho =
      'nomeCompleto,cpf,email,celular,tipoVeiculo,propriedadeVeiculo,cidade,uf,status\n';
    const exemplo =
      'João da Silva,12345678901,joao.silva@example.com,11999998888,MOTOCICLETA,PROPRIO,São Paulo,SP,ATIVO\n';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=\"modelo-importacao-motoristas.csv\"'
    );
    res.send(cabecalho + exemplo);
  }

  async importarCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const arquivo = req.file;

      if (!arquivo) {
        throw new AppError('Arquivo CSV não enviado', 400);
      }

      const conteudo = arquivo.buffer.toString('utf-8');
      const registros = parse(conteudo, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Array<Record<string, string>>;

      const importados: Array<{ linha: number; nome: string; email: string }> = [];
      const ignorados: Array<{ linha: number; motivo: string }> = [];

      const forwarded = req.headers['x-forwarded-for'];
      const forwardedIp = Array.isArray(forwarded)
        ? forwarded[0]
        : typeof forwarded === 'string'
          ? forwarded.split(',')[0]?.trim()
          : undefined;
      const resolvedIp = (typeof req.ip === 'string' && req.ip.length > 0 ? req.ip : undefined) ?? forwardedIp ?? 'unknown';

      const auditData = {
        usuarioId: req.user?.id ?? 'sistema',
        ip: resolvedIp,
        dispositivo:
          typeof req.headers['user-agent'] === 'string'
            ? req.headers['user-agent']
            : 'unknown',
      };

      for (let index = 0; index < registros.length; index += 1) {
        const linha = registros[index];
        const numeroLinha = index + 2; // +1 header + index base 0

        try {
          const nomeCompleto = sanitizeString(linha.nomeCompleto);
          const cpf = (linha.cpf || '').replace(/\D/g, '');
          const email = sanitizeString(linha.email)?.toLowerCase();
          const celular = (linha.celular || '').replace(/\D/g, '');

          if (!nomeCompleto) {
            ignorados.push({ linha: numeroLinha, motivo: 'Nome completo é obrigatório' });
            continue;
          }

          if (cpf.length !== 11) {
            ignorados.push({ linha: numeroLinha, motivo: 'CPF deve conter 11 dígitos' });
            continue;
          }

          if (!email) {
            ignorados.push({ linha: numeroLinha, motivo: 'Email é obrigatório' });
            continue;
          }

          if (!linha.cidade || !linha.uf) {
            ignorados.push({ linha: numeroLinha, motivo: 'Cidade e UF são obrigatórios' });
            continue;
          }

          const cpfExiste = await prisma.motorista.findUnique({
            where: { cpf },
          });
          const emailExiste = await prisma.usuario.findUnique({
            where: { email },
          });

          if (cpfExiste || emailExiste) {
            ignorados.push({
              linha: numeroLinha,
              motivo: 'CPF ou email já cadastrado',
            });
            continue;
          }

          const tipoVeiculoNormalizado = (linha.tipoVeiculo || '').toUpperCase();
          if (!Object.values(TipoVeiculo).includes(tipoVeiculoNormalizado as TipoVeiculo)) {
            ignorados.push({ linha: numeroLinha, motivo: 'Tipo de veículo inválido' });
            continue;
          }

          const propriedadeVeiculoNormalizada = (
            linha.propriedadeVeiculo || 'PROPRIO'
          ).toUpperCase();
          if (
            !Object.values(PropriedadeVeiculo).includes(
              propriedadeVeiculoNormalizada as PropriedadeVeiculo
            )
          ) {
            ignorados.push({ linha: numeroLinha, motivo: 'Propriedade de veículo inválida' });
            continue;
          }

          const statusMotorista = linha.status
            ? (linha.status.toUpperCase() as StatusMotorista)
            : StatusMotorista.ONBOARDING;
          if (!Object.values(StatusMotorista).includes(statusMotorista)) {
            ignorados.push({ linha: numeroLinha, motivo: 'Status do motorista inválido' });
            continue;
          }

          const motorista = await motoristaService.criar(
            {
              transporterId: sanitizeString(linha.transporterId),
              nomeCompleto,
              celular,
              cidade: linha.cidade,
              uf: (linha.uf || '').toUpperCase(),
              bairro: sanitizeString(linha.bairro),
              cep: sanitizeString(linha.cep)?.replace(/\D/g, '') ?? null,
              logradouro: sanitizeString(linha.logradouro),
              numero: sanitizeString(linha.numero),
              complemento: sanitizeString(linha.complemento),
              cpf,
              email,
              chavePix: sanitizeString(linha.chavePix),
              tipoVeiculo: tipoVeiculoNormalizado as TipoVeiculo,
              propriedadeVeiculo: propriedadeVeiculoNormalizada as PropriedadeVeiculo,
              senha: SENHA_TEMPORARIA_PADRAO,
              obrigarAlterarSenha: true,
              status: statusMotorista,
            },
            auditData
          );

          await enviarCredenciaisMotorista({
            nome: motorista.nomeCompleto,
            email: motorista.email,
            senhaTemporaria: SENHA_TEMPORARIA_PADRAO,
          });

          importados.push({
            linha: numeroLinha,
            nome: motorista.nomeCompleto,
            email: motorista.email,
          });
        } catch (erro: any) {
          const motivo =
            erro instanceof AppError
              ? erro.message
              : erro?.message ?? 'Erro desconhecido ao importar linha';
          ignorados.push({ linha: numeroLinha, motivo });
          logger.warn(
            { linha: numeroLinha, motivo },
            'Falha ao importar motorista via CSV'
          );
        }
      }

      logger.info(
        {
          total: registros.length,
          importados: importados.length,
          ignorados: ignorados.length,
        },
        'Importação de motoristas concluída'
      );

      res.json({
        success: true,
        data: {
          importados,
          ignorados,
          resumo: {
            totalLinhas: registros.length,
            importados: importados.length,
            ignorados: ignorados.length,
          },
        },
        message: 'Processamento do CSV concluído',
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
        const documentoExiste = await tx.documentoMotorista.findUnique({ where: { motoristaId: id } });

        if (documentoExiste) {
          await tx.documentoMotorista.update({
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
          await tx.documentoMotorista.create({
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
          const contratoAtivo = await tx.contratoMotorista.findFirst({
            where: { motoristaId: id, ativo: true },
            orderBy: { createdAt: 'desc' }
          });

          if (contratoAtivo) {
            // Atualizar contrato existente
            await tx.contratoMotorista.update({
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
            await tx.contratoMotorista.create({
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
