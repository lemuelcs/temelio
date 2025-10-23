// Tipos de Veículos
export type TipoVeiculo = 'MOTOCICLETA' | 'CARRO_PASSEIO' | 'CARGO_VAN' | 'LARGE_VAN';

// Status de Ativação
export type StatusAtivacao = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';

// Turnos
export type Turno = 'MANHA' | 'TARDE' | 'NOITE';

// Status de Rota
export type StatusRota = 
  | 'PLANEJADA' 
  | 'OFERTADA' 
  | 'ACEITA' 
  | 'RECUSADA' 
  | 'EM_ANDAMENTO' 
  | 'CONCLUIDA' 
  | 'CANCELADA';

// Status de Documento
export type StatusDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO';

// Tipo de Local
export type TipoLocal = 'ESTACAO' | 'CLIENTE' | 'CENTRO_DISTRIBUICAO';

// Interface de Motorista
export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  tipoVeiculo: TipoVeiculo;
  veiculoProprio: boolean;
  placa?: string;
  cnhNumero: string;
  cnhValidade: string;
  brkNumero?: string;
  brkValidade?: string;
  crlvValidade?: string;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  statusAtivacao: StatusAtivacao;
  createdAt: string;
  updatedAt: string;
}

// Interface de Rota
export interface Rota {
  id: string;
  codigoRota: string;
  descricao: string;
  dataRota: string;
  turno: Turno;
  localOrigemId: string;
  localDestinoId: string;
  tipoVeiculoNecessario: TipoVeiculo;
  horasEstimadas: number;
  valorHora: number;
  status: StatusRota;
  motoristaId?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  localOrigem?: Local;
  localDestino?: Local;
  motorista?: Motorista;
  ofertas?: OfertaRota[];
}

// Interface de Oferta de Rota
export interface OfertaRota {
  id: string;
  rotaId: string;
  motoristaId: string;
  dataOferta: string;
  status: 'PENDENTE' | 'ACEITA' | 'RECUSADA' | 'EXPIRADA';
  dataResposta?: string;
  motivoRecusa?: string;
  createdAt: string;
  motorista?: Motorista;
  rota?: Rota;
}

// Interface de Disponibilidade
export interface Disponibilidade {
  id: string;
  motoristaId: string;
  data: string;
  turno: Turno;
  disponivel: boolean;
  createdAt: string;
  updatedAt: string;
  motorista?: Motorista;
}

// Interface de Local
export interface Local {
  id: string;
  nome: string;
  tipo: TipoLocal;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude?: number;
  longitude?: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface de Tabela de Preços
export interface TabelaPreco {
  id: string;
  tipoVeiculo: TipoVeiculo;
  valorHora: number;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface de Usuário
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: 'ADMIN' | 'PLANEJADOR' | 'MOTORISTA';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface de Login
export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  user: Usuario;
}

// Interface de Alerta
export interface AlertaCompliance {
  motorista: {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    tipoVeiculo: TipoVeiculo;
  };
  documentos: {
    cnh: {
      numero: string;
      validade: string;
      diasParaVencimento: number;
      status: StatusDocumento;
    };
    brk?: {
      numero: string;
      validade: string;
      diasParaVencimento: number;
      status: StatusDocumento;
    };
    crlv?: {
      validade: string;
      diasParaVencimento: number;
      status: StatusDocumento;
    };
  };
  elegibilidade: {
    elegivel: boolean;
    motivo?: string;
  };
}

// Tipos auxiliares para formulários
export type MotoristaFormData = Omit<Motorista, 'id' | 'createdAt' | 'updatedAt' | 'elegivel' | 'motivoInelegibilidade'>;
export type RotaFormData = Omit<Rota, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'motoristaId' | 'localOrigem' | 'localDestino' | 'motorista' | 'ofertas'>;
export type LocalFormData = Omit<Local, 'id' | 'createdAt' | 'updatedAt'>;
export type TabelaPrecoFormData = Omit<TabelaPreco, 'id' | 'createdAt' | 'updatedAt'>;

// Labels amigáveis
export const TipoVeiculoLabels: Record<TipoVeiculo, string> = {
  MOTOCICLETA: 'Motocicleta',
  CARRO_PASSEIO: 'Carro de Passeio',
  CARGO_VAN: 'Van Carga',
  LARGE_VAN: 'Van Grande',
};

export const TurnoLabels: Record<Turno, string> = {
  MANHA: 'Manhã (06:00 - 14:00)',
  TARDE: 'Tarde (14:00 - 22:00)',
  NOITE: 'Noite (22:00 - 06:00)',
};

export const StatusRotaLabels: Record<StatusRota, string> = {
  PLANEJADA: 'Planejada',
  OFERTADA: 'Ofertada',
  ACEITA: 'Aceita',
  RECUSADA: 'Recusada',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const StatusAtivacaoLabels: Record<StatusAtivacao, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
};

export const TipoLocalLabels: Record<TipoLocal, string> = {
  ESTACAO: 'Estação',
  CLIENTE: 'Cliente',
  CENTRO_DISTRIBUICAO: 'Centro de Distribuição',
};