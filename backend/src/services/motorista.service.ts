import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { TipoVeiculo, StatusMotorista, PropriedadeVeiculo } from '@prisma/client';
import bcrypt from 'bcrypt';
import logger from '../lib/logger';

const DEFAULT_TEMP_PASSWORD = process.env.MOTORISTA_SENHA_PADRAO ?? 'temelio123';

interface CadastroMotoristaData {
  transporterId?: string | null;
  nomeCompleto: string;
  celular: string;
  cidade: string;
  uf: string;
  bairro?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  cpf: string;
  email: string;
  chavePix?: string | null;
  tipoVeiculo: TipoVeiculo;
  propriedadeVeiculo: PropriedadeVeiculo;
  senha?: string;
  obrigarAlterarSenha?: boolean;
  dataNascimento?: Date;
  anoFabricacaoVeiculo?: number | null;
  placaVeiculo?: string | null;
  numeroCNH?: string | null;
  validadeCNH?: Date;
  anoLicenciamento?: number | null;
  dataVerificacaoBRK?: Date;        // NOVO
  proximaVerificacaoBRK?: Date;     // NOVO
  statusBRK?: boolean;              // NOVO
  status?: StatusMotorista;
  numeroContrato?: string;
  dataAssinatura?: Date;
  dataVigenciaInicial?: Date;
  cnpjMEI?: string;
  razaoSocialMEI?: string;
}

interface AtualizacaoMotoristaData {
  nomeCompleto?: string;
  celular?: string;
  cidade?: string;
  uf?: string;
  bairro?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  email?: string;
  chavePix?: string | null;
  tipoVeiculo?: TipoVeiculo;
  propriedadeVeiculo?: PropriedadeVeiculo;
  anoFabricacaoVeiculo?: number | null;
  placaVeiculo?: string | null;
  status?: StatusMotorista;
  transporterId?: string | null;
}

interface FiltrosPesquisa {
  nome?: string;
  tipoVeiculo?: TipoVeiculo;
  status?: StatusMotorista;
  cidade?: string;
  uf?: string;
}

interface AuditData {
  usuarioId: string;
  ip: string;
  dispositivo: string;
  latitude?: number;
  longitude?: number;
}

class MotoristaService {
  // Criar motorista
  async criar(data: CadastroMotoristaData, auditData: AuditData) {
    const {
      transporterId,
      nomeCompleto,
      celular,
      cidade,
      uf,
      bairro,
      cep,
      logradouro,
      numero,
      complemento,
      cpf,
      email,
      chavePix,
      tipoVeiculo,
      propriedadeVeiculo,
      senha,
      obrigarAlterarSenha = true,
      dataNascimento,
      anoFabricacaoVeiculo,
      placaVeiculo,
      numeroCNH,
      validadeCNH,
      anoLicenciamento,
      dataVerificacaoBRK,      // NOVO
      proximaVerificacaoBRK,   // NOVO
      statusBRK,               // NOVO
      status,
      numeroContrato,
      dataAssinatura,
      dataVigenciaInicial,
      cnpjMEI,
      razaoSocialMEI
    } = data;

    // Validar se CPF já existe
    const cpfExiste = await prisma.motorista.findUnique({
      where: { cpf }
    });

    if (cpfExiste) {
      throw new AppError('CPF já cadastrado', 400);
    }

    // Validar se email já existe
    const emailExiste = await prisma.usuario.findUnique({
      where: { email }
    });

    if (emailExiste) {
      throw new AppError('Email já cadastrado', 400);
    }

    // Validar se transporterId já existe (apenas se fornecido)
    if (transporterId) {
      const transporterIdExiste = await prisma.motorista.findUnique({
        where: { transporterId }
      });

      if (transporterIdExiste) {
        throw new AppError('Transporter ID já cadastrado', 400);
      }
    }

    // Validar ano de fabricação (não pode ter mais de 15 anos)
    if (anoFabricacaoVeiculo) {
      const anoAtual = new Date().getFullYear();
      const idadeVeiculo = anoAtual - anoFabricacaoVeiculo;
      
      if (idadeVeiculo > 15) {
        throw new AppError('Veículo não pode ter mais de 15 anos de fabricação', 400);
      }
    }

    // Hash da senha
    const senhaEmUso = senha ?? DEFAULT_TEMP_PASSWORD;
    const senhaHash = await bcrypt.hash(senhaEmUso, 10);

    // Limpar CEP removendo caracteres não numéricos
    const cepLimpo = cep ? cep.replace(/\D/g, '') : null;

    // Criar motorista com relacionamentos
    const motorista = await prisma.motorista.create({
      data: {
        transporterId: transporterId || null,
        nomeCompleto,
        celular,
        cep: cepLimpo,
        logradouro: logradouro || null,
        numero: numero || null,
        complemento: complemento || null,
        cidade,
        uf,
        bairro: bairro || null,
        cpf,
        email,
        dataNascimento: dataNascimento ?? null,
        chavePix: chavePix || null,
        tipoVeiculo,
        propriedadeVeiculo,
        status: status || StatusMotorista.ONBOARDING,
        anoFabricacaoVeiculo: anoFabricacaoVeiculo || null,
        placaVeiculo: placaVeiculo || null,
        
        // Criar usuário associado
        usuario: {
          create: {
            email,
            senha: senhaHash,
            nome: nomeCompleto,
            perfil: 'MOTORISTA',
            ativo: status === StatusMotorista.ATIVO,
            deveAlterarSenha: obrigarAlterarSenha
          }
        },

        // Criar documentos se fornecidos
        ...(numeroCNH || validadeCNH || anoLicenciamento || dataVerificacaoBRK || proximaVerificacaoBRK || statusBRK !== undefined ? {
          documentos: {
            create: {
              numeroCNH: numeroCNH || null,
              validadeCNH: validadeCNH || null,
              anoLicenciamento: anoLicenciamento || null,
              dataVerificacaoBRK: dataVerificacaoBRK || null,              // NOVO
              proximaVerificacaoBRK: proximaVerificacaoBRK || null,        // NOVO
              statusBRK: statusBRK !== undefined ? statusBRK : false       // NOVO
            }
          }
        } : {}),
        

        // Criar contrato se fornecido
        ...(numeroContrato ? {
          contratos: {
            create: {
              numeroContrato,
              dataAssinatura: dataAssinatura || new Date(),
              dataVigenciaInicial: dataVigenciaInicial || new Date(),
              ativo: true,
              cnpjMEI: cnpjMEI || null,
              razaoSocialMEI: razaoSocialMEI || null
            }
          }
        } : {})
      },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true,
            perfil: true
          }
        },
        documento: true,
        contratos: true
      }
    });

    // Registrar auditoria
    await this.registrarAuditoria({
      ...auditData,
      acao: 'CADASTRO_MOTORISTA',
      entidade: 'Motorista',
      entidadeId: motorista.id,
      descricao: `Cadastro do motorista ${nomeCompleto} (${cpf})`
    });

    return motorista;
  }

  // Listar motoristas com filtros - ordenado por createdAt DESC
  async listar(filtros: FiltrosPesquisa = {}) {
    const { nome, tipoVeiculo, status, cidade, uf } = filtros;

    const where: any = {};

    if (nome) {
      where.nomeCompleto = {
        contains: nome,
        mode: 'insensitive'
      };
    }

    if (tipoVeiculo) {
      where.tipoVeiculo = tipoVeiculo;
    }

    if (status) {
      where.status = status;
    }

    if (cidade) {
      where.cidade = cidade;
    }

    if (uf) {
      where.uf = uf;
    }

    const motoristas = await prisma.motorista.findMany({
      where,
      include: {
        documento: true,
        contratos: {
          where: { ativo: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return motoristas;
  }

  // Buscar motorista por ID
  async buscarPorId(id: string) {
    const motorista = await prisma.motorista.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true,
            perfil: true,
            ativo: true
          }
        },
        documento: true,
        contratos: {
          where: { ativo: true }
        },
        disponibilidades: {
          where: {
            data: {
              gte: new Date()
            }
          },
          orderBy: {
            data: 'asc'
          }
        }
      }
    });

    if (!motorista) {
      throw new AppError('Motorista não encontrado', 404);
    }

    return motorista;
  }

  // Atualizar motorista
  async atualizar(id: string, data: AtualizacaoMotoristaData, auditData: AuditData) {
    // Verificar se motorista existe
    await this.buscarPorId(id);

    // Validar ano de fabricação se fornecido
    if (data.anoFabricacaoVeiculo) {
      const anoAtual = new Date().getFullYear();
      const idadeVeiculo = anoAtual - data.anoFabricacaoVeiculo;
      
      if (idadeVeiculo > 15) {
        throw new AppError('Veículo não pode ter mais de 15 anos de fabricação', 400);
      }
    }

    // Validar se transporterId já existe em outro motorista (se fornecido)
    if (data.transporterId) {
      const transporterIdExiste = await prisma.motorista.findFirst({
        where: {
          transporterId: data.transporterId,
          id: { not: id }
        }
      });

      if (transporterIdExiste) {
        throw new AppError('Transporter ID já cadastrado em outro motorista', 400);
      }
    }

    // Criar objeto com apenas os campos que foram fornecidos
    const dadosParaAtualizar: any = {};

    if (data.nomeCompleto !== undefined) dadosParaAtualizar.nomeCompleto = data.nomeCompleto;
    if (data.celular !== undefined) dadosParaAtualizar.celular = data.celular;
    // Limpar CEP removendo caracteres não numéricos se presente
    if (data.cep !== undefined) dadosParaAtualizar.cep = data.cep ? data.cep.replace(/\D/g, '') : null;
    if (data.logradouro !== undefined) dadosParaAtualizar.logradouro = data.logradouro;
    if (data.numero !== undefined) dadosParaAtualizar.numero = data.numero;
    if (data.complemento !== undefined) dadosParaAtualizar.complemento = data.complemento;
    if (data.cidade !== undefined) dadosParaAtualizar.cidade = data.cidade;
    if (data.uf !== undefined) dadosParaAtualizar.uf = data.uf;
    if (data.bairro !== undefined) dadosParaAtualizar.bairro = data.bairro;
    if (data.email !== undefined) dadosParaAtualizar.email = data.email;
    if (data.chavePix !== undefined) dadosParaAtualizar.chavePix = data.chavePix;
    if (data.tipoVeiculo !== undefined) dadosParaAtualizar.tipoVeiculo = data.tipoVeiculo;
    if (data.propriedadeVeiculo !== undefined) dadosParaAtualizar.propriedadeVeiculo = data.propriedadeVeiculo;
    if (data.anoFabricacaoVeiculo !== undefined) dadosParaAtualizar.anoFabricacaoVeiculo = data.anoFabricacaoVeiculo;
    if (data.placaVeiculo !== undefined) dadosParaAtualizar.placaVeiculo = data.placaVeiculo;
    if (data.status !== undefined) dadosParaAtualizar.status = data.status;
    if (data.transporterId !== undefined) dadosParaAtualizar.transporterId = data.transporterId;

    logger.debug(
      { motoristaId: id, camposAtualizados: Object.keys(dadosParaAtualizar) },
      'Atualizando motorista'
    );

    const motoristaAtualizado = await prisma.motorista.update({
      where: { id },
      data: dadosParaAtualizar,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true,
            perfil: true
          }
        },
        documento: true,
        contratos: {
          where: { ativo: true }
        }
      }
    });

    // Atualizar status do usuário se o status do motorista mudou
    if (data.status !== undefined) {
      await prisma.usuario.update({
        where: { id: motoristaAtualizado.usuarioId },
        data: {
          ativo: data.status === StatusMotorista.ATIVO
        }
      });
    }

    // Registrar auditoria
    await this.registrarAuditoria({
      ...auditData,
      acao: 'ATUALIZACAO_MOTORISTA',
      entidade: 'Motorista',
      entidadeId: id,
      descricao: `Atualização dos dados do motorista ${motoristaAtualizado.nomeCompleto}`
    });

    return motoristaAtualizado;
  }

  // Mudar status do motorista
  async mudarStatus(id: string, novoStatus: StatusMotorista, motivo: string | null, auditData: AuditData) {
    const motorista = await this.buscarPorId(id);

    // Validar se precisa motivo - CORREÇÃO: usar as constantes do enum
    const statusQueRequeremMotivo = [
      'EXCLUIDO' as const,
      'INATIVO' as const,
      'SUSPENSO' as const
    ];

    if (statusQueRequeremMotivo.includes(novoStatus as any) && !motivo) {
      throw new AppError('Motivo é obrigatório para este status', 400);
    }

    const motoristaAtualizado = await prisma.$transaction(async (tx) => {
      // Atualizar motorista
      const updated = await tx.motorista.update({
        where: { id },
        data: {
          status: novoStatus,
          usuario: {
            update: {
              ativo: novoStatus === StatusMotorista.ATIVO
            }
          }
        },
        include: {
          usuario: {
            select: {
              id: true,
              email: true,
              nome: true,
              perfil: true,
              ativo: true
            }
          }
        }
      });

      // Registrar histórico de mudança de status
      await tx.historicoStatusMotorista.create({
        data: {
          motoristaId: id,
          statusAnterior: motorista.status,
          statusNovo: novoStatus,
          motivo: motivo || null,
          alteradoPor: auditData.usuarioId
        }
      });

      return updated;
    });
    
    // Registrar auditoria
    const acoes: Record<string, string> = {
      ATIVO: 'ATIVACAO_MOTORISTA',
      INATIVO: 'INATIVACAO_MOTORISTA',
      SUSPENSO: 'SUSPENSAO_MOTORISTA',
      ONBOARDING: 'ONBOARDING_MOTORISTA',
      EXCLUIDO: 'EXCLUSAO_MOTORISTA'
    };

    await this.registrarAuditoria({
      ...auditData,
      acao: acoes[novoStatus] || 'MUDANCA_STATUS_MOTORISTA',
      entidade: 'Motorista',
      entidadeId: id,
      descricao: `Status do motorista ${motorista.nomeCompleto} alterado de ${motorista.status} para ${novoStatus}${motivo ? `: ${motivo}` : ''}`
    });

    return motoristaAtualizado;
  }

  // Atualizar método excluir para usar mudarStatus
  async excluir(id: string, motivo: string, auditData: AuditData) {
    return this.mudarStatus(id, StatusMotorista.EXCLUIDO, motivo, auditData);
  }

  // Atualizar documentos
  async atualizarDocumentos(
    motoristaId: string,
    data: {
      numeroCNH?: string;
      validadeCNH?: Date;
      anoLicenciamento?: number;
      dataVerificacaoBRK?: Date;
      proximaVerificacaoBRK?: Date;
      statusBRK?: boolean;
    },
    auditData: AuditData
  ) {
    await this.buscarPorId(motoristaId);

    // Validar ano de licenciamento (deve ser ano corrente ou anterior)
    if (data.anoLicenciamento) {
      const anoAtual = new Date().getFullYear();
      if (data.anoLicenciamento < anoAtual - 1 || data.anoLicenciamento > anoAtual) {
        throw new AppError('Ano de licenciamento deve ser do ano corrente ou do ano anterior', 400);
      }
    }

    const documento = await prisma.documentoMotorista.upsert({
      where: { motoristaId },
      update: data,
      create: {
        motoristaId,
        ...data
      }
    });

    // Registrar auditoria
    await this.registrarAuditoria({
      ...auditData,
      acao: 'ATUALIZACAO_DOCUMENTOS',
      entidade: 'DocumentoMotorista',
      entidadeId: documento.id,
      descricao: `Atualização de documentos do motorista`
    });

    return documento;
  }

  // Verificar elegibilidade do motorista
  async verificarElegibilidade(motoristaId: string) {
    const motorista = await prisma.motorista.findUnique({
      where: { id: motoristaId },
      include: {
        documento: true
      }
    });

    if (!motorista) {
      throw new AppError('Motorista não encontrado', 404);
    }

    const erros: string[] = [];
    const avisos: string[] = [];

    // REMOVIDO: Verificação de status - não é mais critério de elegibilidade

    // Verificar idade do veículo
    if (motorista.anoFabricacaoVeiculo) {
      const anoAtual = new Date().getFullYear();
      const idadeVeiculo = anoAtual - motorista.anoFabricacaoVeiculo;
      
      if (idadeVeiculo > 15) {
        erros.push('Veículo com mais de 15 anos de fabricação');
      }
    }

    const documento = Array.isArray(motorista.documento) ? motorista.documento[0] : null;

    if (!documento) {
      erros.push('Documentos não cadastrados');
    } else {
      // Verificar CNH
      if (!documento.numeroCNH) {
        erros.push('Número da CNH não cadastrado');
      }

      if (documento.validadeCNH) {
        const diasParaVencer = Math.ceil(
          (documento.validadeCNH.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diasParaVencer < 0) {
          erros.push('CNH vencida');
        } else if (diasParaVencer <= 30) {
          avisos.push(`CNH vence em ${diasParaVencer} dias`);
        }
      } else {
        erros.push('Validade da CNH não cadastrada');
      }

      // Verificar CRLV
      if (documento.anoLicenciamento) {
        const anoAtual = new Date().getFullYear();
        if (documento.anoLicenciamento < anoAtual - 1) {
          erros.push('CRLV desatualizado');
        }
      } else {
        erros.push('Ano de licenciamento não cadastrado');
      }

      // Verificar BRK
      if (documento.proximaVerificacaoBRK) {
        const diasParaVencer = Math.ceil(
          (documento.proximaVerificacaoBRK.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diasParaVencer < 0) {
          erros.push('Verificação BRK vencida');
        } else if (diasParaVencer <= 7) {
          avisos.push(`BRK vence em ${diasParaVencer} dias`);
        }
      } else {
        erros.push('Verificação BRK não cadastrada');
      }

      if (!documento.statusBRK) {
        erros.push('BRK não aprovado');
      }
    }

    return {
      elegivel: erros.length === 0,
      erros,
      avisos
    };
  }

  // Registrar auditoria
  private async registrarAuditoria(data: {
    usuarioId: string;
    acao: string;
    entidade: string;
    entidadeId?: string;
    descricao?: string;
    ip: string;
    dispositivo: string;
    latitude?: number;
    longitude?: number;
  }) {
    await prisma.auditLog.create({
      data
    });
  }
}

export default new MotoristaService();
