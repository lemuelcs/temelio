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
    // Template expandido com todos os campos disponíveis no formulário
    const cabecalho = [
      // Campos obrigatórios
      'nomeCompleto',
      'cpf',
      'email',
      'celular',
      'cidade',
      'uf',
      'tipoVeiculo',
      'propriedadeVeiculo',
      'anoFabricacaoVeiculo',
      'status',
      // Dados pessoais opcionais
      'transporterId',
      'dataNascimento',
      'chavePix',
      // Endereço
      'cep',
      'logradouro',
      'numero',
      'complemento',
      'bairro',
      // Veículo
      'placaVeiculo',
      // Documentos
      'numeroCNH',
      'validadeCNH',
      'anoLicenciamento',
      'dataVerificacaoBRK',
      'proximaVerificacaoBRK',
      'statusBRK',
      // Contrato e MEI
      'numeroContrato',
      'dataAssinatura',
      'dataVigenciaInicial',
      'cnpjMEI',
      'razaoSocialMEI',
    ].join(',') + '\n';

    // Exemplo com todos os campos preenchidos
    const exemplo = [
      // Campos obrigatórios
      'João da Silva',                    // nomeCompleto
      '12345678901',                       // cpf
      'joao.silva@example.com',           // email
      '11999998888',                       // celular
      'São Paulo',                         // cidade
      'SP',                                // uf
      'CARGO_VAN',                         // tipoVeiculo (MOTOCICLETA, CARRO_PASSEIO, CARGO_VAN, LARGE_VAN)
      'PROPRIO',                           // propriedadeVeiculo (PROPRIO, TRANSPORTADORA)
      '2020',                              // anoFabricacaoVeiculo
      'ONBOARDING',                        // status (ONBOARDING, ATIVO, INATIVO, SUSPENSO, EXCLUIDO)
      // Dados pessoais opcionais
      '',                                  // transporterId
      '1990-01-15',                        // dataNascimento (formato: YYYY-MM-DD)
      '12345678901',                       // chavePix
      // Endereço
      '01310100',                          // cep
      'Av. Paulista',                      // logradouro
      '1578',                              // numero
      'Apto 101',                          // complemento
      'Bela Vista',                        // bairro
      // Veículo
      'ABC1D23',                           // placaVeiculo
      // Documentos
      '12345678901',                       // numeroCNH
      '2026-12-31',                        // validadeCNH (formato: YYYY-MM-DD)
      '2024',                              // anoLicenciamento
      '2024-01-15',                        // dataVerificacaoBRK (formato: YYYY-MM-DD)
      '2025-01-15',                        // proximaVerificacaoBRK (formato: YYYY-MM-DD)
      'true',                              // statusBRK (true ou false)
      // Contrato e MEI
      'CONTRATO-2024-001',                 // numeroContrato
      '2024-01-10',                        // dataAssinatura (formato: YYYY-MM-DD)
      '2024-01-10',                        // dataVigenciaInicial (formato: YYYY-MM-DD)
      '12345678000190',                    // cnpjMEI
      'João da Silva MEI',                 // razaoSocialMEI
    ].join(',') + '\n';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=\"modelo-importacao-motoristas.csv\"'
    );
    res.send(cabecalho + exemplo);
  }

  async exportarCsv(_req: Request, res: Response, next: NextFunction) {
    try {
      const motoristas = await prisma.motorista.findMany({
        include: {
          documento: true,
          contratos: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ nomeCompleto: 'asc' }],
      });

      const campos = [
        'nomeCompleto',
        'cpf',
        'email',
        'celular',
        'cidade',
        'uf',
        'tipoVeiculo',
        'propriedadeVeiculo',
        'anoFabricacaoVeiculo',
        'status',
        'transporterId',
        'dataNascimento',
        'chavePix',
        'cep',
        'logradouro',
        'numero',
        'complemento',
        'bairro',
        'placaVeiculo',
        'numeroCNH',
        'validadeCNH',
        'anoLicenciamento',
        'dataVerificacaoBRK',
        'proximaVerificacaoBRK',
        'statusBRK',
        'numeroContrato',
        'dataAssinatura',
        'dataVigenciaInicial',
        'cnpjMEI',
        'razaoSocialMEI',
      ];

      const formatarData = (valor?: Date | null) => {
        if (!valor) return '';
        return valor.toISOString().split('T')[0];
      };

      const sanitizeCsv = (valor: unknown) => {
        if (valor === null || valor === undefined) {
          return '""';
        }

        let texto: string;
        if (valor instanceof Date) {
          texto = formatarData(valor);
        } else if (typeof valor === 'boolean') {
          texto = valor ? 'true' : 'false';
        } else {
          texto = String(valor);
        }

        const semQuebraLinha = texto.replace(/\r?\n/g, ' ').trim();
        const protegido = semQuebraLinha.replace(/"/g, '""');
        return `"${protegido}"`;
      };

      const linhas = motoristas.map((motorista) => {
        const documento = motorista.documento;
        const contratoAtual = motorista.contratos[0];

        const valores = [
          motorista.nomeCompleto,
          motorista.cpf,
          motorista.email,
          motorista.celular,
          motorista.cidade,
          motorista.uf,
          motorista.tipoVeiculo,
          motorista.propriedadeVeiculo,
          motorista.anoFabricacaoVeiculo ?? '',
          motorista.status,
          motorista.transporterId ?? '',
          formatarData(motorista.dataNascimento),
          motorista.chavePix ?? '',
          motorista.cep ?? '',
          motorista.logradouro ?? '',
          motorista.numero ?? '',
          motorista.complemento ?? '',
          motorista.bairro ?? '',
          motorista.placaVeiculo ?? '',
          documento?.numeroCNH ?? '',
          formatarData(documento?.validadeCNH ?? null),
          documento?.anoLicenciamento ?? '',
          formatarData(documento?.dataVerificacaoBRK ?? null),
          formatarData(documento?.proximaVerificacaoBRK ?? null),
          documento?.statusBRK ?? '',
          contratoAtual?.numeroContrato ?? '',
          formatarData(contratoAtual?.dataAssinatura ?? null),
          formatarData(contratoAtual?.dataVigenciaInicial ?? null),
          contratoAtual?.cnpjMEI ?? '',
          contratoAtual?.razaoSocialMEI ?? '',
        ];

        return valores.map(sanitizeCsv).join(',');
      });

      const cabecalho = campos.join(',');
      const conteudo = '\ufeff' + [cabecalho, ...linhas].join('\n');
      const dataArquivo = new Date().toISOString().split('T')[0];

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="motoristas_${dataArquivo}.csv"`
      );
      res.send(conteudo);
    } catch (error) {
      next(error);
    }
  }

  async importarCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const arquivo = req.file;

      if (!arquivo) {
        throw new AppError('Arquivo CSV não enviado', 400);
      }

      let conteudo = arquivo.buffer.toString('utf-8');

      if (conteudo.charCodeAt(0) === 0xfeff) {
        conteudo = conteudo.slice(1);
      }

      // Validar formato básico do CSV antes de parsear
      const linhas = conteudo.split('\n').filter(l => l.trim().length > 0);
      if (linhas.length < 2) {
        throw new AppError('Arquivo CSV vazio ou inválido', 400);
      }

      // Detectar delimitador: tentar vírgula primeiro, depois ponto-e-vírgula
      const primeiraLinha = linhas[0];
      const virgulas = (primeiraLinha.match(/,/g) || []).length;
      const pontoVirgulas = (primeiraLinha.match(/;/g) || []).length;
      const delimiter = pontoVirgulas > virgulas ? ';' : ',';

      let registros: Array<Record<string, string>>;
      try {
        registros = parse(conteudo, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          delimiter,
          relax_column_count: true, // Permite linhas com número diferente de colunas
          relax_quotes: true, // Permite aspas mal formatadas
        }) as Array<Record<string, string>>;
      } catch (parseError: any) {
        logger.error({ error: parseError.message }, 'Erro ao parsear CSV');
        throw new AppError(
          `Erro ao processar arquivo CSV: ${parseError.message}. Verifique se o arquivo está no formato correto com os campos separados por vírgula ou ponto-e-vírgula.`,
          400
        );
      }

      // Validar que há pelo menos os campos obrigatórios no cabeçalho
      const camposObrigatorios = ['nomeCompleto', 'cpf', 'email', 'celular', 'cidade', 'uf', 'tipoVeiculo', 'propriedadeVeiculo', 'anoFabricacaoVeiculo', 'status'];
      if (registros.length > 0) {
        const chavesDisponiveis = Object.keys(registros[0]);
        const camposFaltando = camposObrigatorios.filter(campo => !chavesDisponiveis.includes(campo));

        if (camposFaltando.length > 0) {
          throw new AppError(
            `Campos obrigatórios faltando no arquivo CSV: ${camposFaltando.join(', ')}. Baixe o modelo correto usando o botão "Baixar Modelo".`,
            400
          );
        }
      }

      const importados: Array<{ linha: number; nome: string; email: string; acao: 'criado' }> = [];
      const atualizados: Array<{ linha: number; nome: string; email: string; acao: 'atualizado' }> = [];
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
          const emailLimpo = sanitizeString(linha.email);
          const email = emailLimpo?.toLowerCase();
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

          const cidade = sanitizeString(linha.cidade);
          const uf = sanitizeString(linha.uf)?.toUpperCase();

          if (!cidade || !uf) {
            ignorados.push({ linha: numeroLinha, motivo: 'Cidade e UF são obrigatórios' });
            continue;
          }

          const anoFabricacao = toNumberOrNull(linha.anoFabricacaoVeiculo);
          if (!anoFabricacao) {
            ignorados.push({ linha: numeroLinha, motivo: 'Ano de fabricação do veículo é obrigatório' });
            continue;
          }

          const anoAtual = new Date().getFullYear();
          if (anoAtual - anoFabricacao > 15) {
            ignorados.push({
              linha: numeroLinha,
              motivo: 'Veículo não pode ter mais de 15 anos de fabricação',
            });
            continue;
          }

          const tipoVeiculoNormalizado = (linha.tipoVeiculo || '').toUpperCase();
          if (!Object.values(TipoVeiculo).includes(tipoVeiculoNormalizado as TipoVeiculo)) {
            ignorados.push({ linha: numeroLinha, motivo: 'Tipo de veículo inválido' });
            continue;
          }

          const propriedadeVeiculoNormalizada = (linha.propriedadeVeiculo || 'PROPRIO').toUpperCase();
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

          let motoristaExistente = email
            ? await prisma.motorista.findFirst({
                where: { email },
              })
            : null;

          if (!motoristaExistente && emailLimpo && emailLimpo !== email) {
            motoristaExistente = await prisma.motorista.findFirst({
              where: { email: emailLimpo },
            });
          }

          if (motoristaExistente) {
            const cpfPertenceOutro = await prisma.motorista.findUnique({ where: { cpf } });
            if (cpfPertenceOutro && cpfPertenceOutro.id !== motoristaExistente.id) {
              ignorados.push({
                linha: numeroLinha,
                motivo: 'CPF pertence a outro motorista',
              });
              continue;
            }
          } else {
            const cpfExiste = await prisma.motorista.findUnique({
              where: { cpf },
            });
            let usuarioExistente = email
              ? await prisma.usuario.findFirst({
                  where: { email },
                })
              : null;

            if (!usuarioExistente && emailLimpo && emailLimpo !== email) {
              usuarioExistente = await prisma.usuario.findFirst({
                where: { email: emailLimpo },
              });
            }

            if (cpfExiste || usuarioExistente) {
              ignorados.push({
                linha: numeroLinha,
                motivo: 'CPF ou email já cadastrado',
              });
              continue;
            }
          }

          const transporterId = sanitizeString(linha.transporterId);
          const dataNascimento = toDateOrUndefined(linha.dataNascimento);
          const chavePix = sanitizeString(linha.chavePix);
          const cep = sanitizeString(linha.cep)?.replace(/\D/g, '') ?? null;
          const logradouro = sanitizeString(linha.logradouro);
          const numeroEndereco = sanitizeString(linha.numero);
          const complemento = sanitizeString(linha.complemento);
          const bairro = sanitizeString(linha.bairro);
          const placaVeiculo = sanitizeString(linha.placaVeiculo);
          const numeroCNH = sanitizeString(linha.numeroCNH);
          const validadeCNH = toDateOrUndefined(linha.validadeCNH);
          const anoLicenciamento = toNumberOrNull(linha.anoLicenciamento);
          const dataVerificacaoBRK = toDateOrUndefined(linha.dataVerificacaoBRK);
          const proximaVerificacaoBRK = toDateOrUndefined(linha.proximaVerificacaoBRK);
          const statusBRKNormalizado =
            typeof linha.statusBRK === 'boolean'
              ? linha.statusBRK
              : linha.statusBRK === 'true'
                ? true
                : linha.statusBRK === 'false'
                  ? false
                  : undefined;
          const numeroContrato = sanitizeString(linha.numeroContrato);
          const dataAssinatura = toDateOrUndefined(linha.dataAssinatura);
          const dataVigenciaInicial = toDateOrUndefined(linha.dataVigenciaInicial);
          const cnpjMEI = sanitizeString(linha.cnpjMEI)?.replace(/\D/g, '') ?? undefined;
          const razaoSocialMEI = sanitizeString(linha.razaoSocialMEI) ?? undefined;

          if (motoristaExistente) {
            await prisma.$transaction(async (tx) => {
              await tx.motorista.update({
                where: { id: motoristaExistente.id },
                data: {
                  transporterId,
                  nomeCompleto,
                  cpf,
                  dataNascimento: dataNascimento ?? null,
                  email,
                  celular,
                  chavePix,
                  cep,
                  logradouro,
                  numero: numeroEndereco,
                  complemento,
                  bairro,
                  cidade,
                  uf,
                  tipoVeiculo: tipoVeiculoNormalizado as TipoVeiculo,
                  propriedadeVeiculo: propriedadeVeiculoNormalizada as PropriedadeVeiculo,
                  placaVeiculo,
                  anoFabricacaoVeiculo: anoFabricacao ?? null,
                  status: statusMotorista,
                  usuario: {
                    update: {
                      nome: nomeCompleto,
                      email,
                      ativo: statusMotorista === StatusMotorista.ATIVO,
                    },
                  },
                  documento: {
                    upsert: {
                      create: {
                        numeroCNH,
                        validadeCNH: validadeCNH ?? null,
                        anoLicenciamento: anoLicenciamento ?? null,
                        dataVerificacaoBRK: dataVerificacaoBRK ?? null,
                        proximaVerificacaoBRK: proximaVerificacaoBRK ?? null,
                        statusBRK: statusBRKNormalizado ?? false,
                      },
                      update: {
                        numeroCNH,
                        validadeCNH: validadeCNH ?? null,
                        anoLicenciamento: anoLicenciamento ?? null,
                        dataVerificacaoBRK: dataVerificacaoBRK ?? null,
                        proximaVerificacaoBRK: proximaVerificacaoBRK ?? null,
                        ...(statusBRKNormalizado !== undefined ? { statusBRK: statusBRKNormalizado } : {}),
                      },
                    },
                  },
                },
              });

              if (numeroContrato) {
                const contratoPayload = {
                  motoristaId: motoristaExistente.id,
                  numeroContrato,
                  dataAssinatura: dataAssinatura ?? new Date(),
                  dataVigenciaInicial: dataVigenciaInicial ?? new Date(),
                  ativo: true,
                  cnpjMEI: cnpjMEI ?? null,
                  razaoSocialMEI: razaoSocialMEI ?? null,
                };

                await tx.contratoMotorista.upsert({
                  where: { numeroContrato },
                  update: contratoPayload,
                  create: contratoPayload,
                });

                await tx.contratoMotorista.updateMany({
                  where: {
                    motoristaId: motoristaExistente.id,
                    numeroContrato: { not: numeroContrato },
                  },
                  data: { ativo: false },
                });
              }
            });

            atualizados.push({
              linha: numeroLinha,
              nome: nomeCompleto,
              email,
              acao: 'atualizado',
            });
            continue;
          }

          const motorista = await motoristaService.criar(
            {
              transporterId,
              nomeCompleto,
              cpf,
              dataNascimento,
              email,
              celular,
              chavePix,
              cep,
              logradouro,
              numero: numeroEndereco,
              complemento,
              bairro,
              cidade,
              uf,
              tipoVeiculo: tipoVeiculoNormalizado as TipoVeiculo,
              propriedadeVeiculo: propriedadeVeiculoNormalizada as PropriedadeVeiculo,
              placaVeiculo,
              anoFabricacaoVeiculo: anoFabricacao ?? undefined,
              numeroCNH,
              validadeCNH,
              anoLicenciamento: anoLicenciamento ?? undefined,
              dataVerificacaoBRK,
              proximaVerificacaoBRK,
              statusBRK: statusBRKNormalizado,
              numeroContrato: numeroContrato ?? undefined,
              dataAssinatura,
              dataVigenciaInicial,
              cnpjMEI,
              razaoSocialMEI,
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
            acao: 'criado',
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
          atualizados: atualizados.length,
          ignorados: ignorados.length,
        },
        'Importação de motoristas concluída'
      );

      res.json({
        success: true,
        data: {
          importados,
          atualizados,
          ignorados,
          resumo: {
            totalLinhas: registros.length,
            importados: importados.length,
            atualizados: atualizados.length,
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

  /**
   * Listar aniversariantes da semana
   */
  async listarAniversariantes(req: Request, res: Response, next: NextFunction) {
    try {
      // Buscar todos os motoristas com data de nascimento
      const motoristas = await prisma.motorista.findMany({
        where: {
          dataNascimento: { not: null },
          status: { in: ['ATIVO', 'ONBOARDING'] }
        },
        select: {
          id: true,
          nomeCompleto: true,
          dataNascimento: true,
          celular: true,
          status: true
        },
        orderBy: { nomeCompleto: 'asc' }
      });

      const hoje = new Date();
      const diaHoje = hoje.getDate();
      const mesHoje = hoje.getMonth() + 1;

      // Calcular o início e fim da semana atual
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      const diaInicioSemana = inicioSemana.getDate();
      const mesInicioSemana = inicioSemana.getMonth() + 1;
      const diaFimSemana = fimSemana.getDate();
      const mesFimSemana = fimSemana.getMonth() + 1;

      // Filtrar aniversariantes
      const aniversariantesSemana = motoristas.filter((motorista) => {
        if (!motorista.dataNascimento) return false;

        const dataNasc = new Date(motorista.dataNascimento);
        const diaNasc = dataNasc.getDate();
        const mesNasc = dataNasc.getMonth() + 1;

        // Se a semana cruza o fim do mês
        if (mesInicioSemana !== mesFimSemana) {
          return (
            (mesNasc === mesInicioSemana && diaNasc >= diaInicioSemana) ||
            (mesNasc === mesFimSemana && diaNasc <= diaFimSemana)
          );
        }

        // Semana no mesmo mês
        return mesNasc === mesInicioSemana && diaNasc >= diaInicioSemana && diaNasc <= diaFimSemana;
      });

      const aniversariantesDia = aniversariantesSemana.filter((motorista) => {
        if (!motorista.dataNascimento) return false;
        const dataNasc = new Date(motorista.dataNascimento);
        return dataNasc.getDate() === diaHoje && (dataNasc.getMonth() + 1) === mesHoje;
      });

      res.json({
        success: true,
        data: {
          totalDia: aniversariantesDia.length,
          totalSemana: aniversariantesSemana.length,
          aniversariantes: aniversariantesSemana.map((motorista) => ({
            id: motorista.id,
            nomeCompleto: motorista.nomeCompleto,
            dataNascimento: motorista.dataNascimento,
            celular: motorista.celular,
            status: motorista.status,
            ehHoje: aniversariantesDia.some((a) => a.id === motorista.id)
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MotoristaController();
