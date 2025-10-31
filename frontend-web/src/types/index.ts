// Tipos de Veículos
export type TipoVeiculo = 'MOTOCICLETA' | 'CARRO_PASSEIO' | 'CARGO_VAN' | 'LARGE_VAN';

// Status de Ativação
export type StatusAtivacao = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';

// Turnos
export type Turno = 'MANHA' | 'TARDE' | 'NOITE';

// Status de Rota
export type StatusRota =
  | 'DISPONIVEL'
  | 'OFERTADA'
  | 'ACEITA'
  | 'RECUSADA'
  | 'CANCELADA'
  | 'CONFIRMADA'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'VALIDADA';

// Status de Tracking do Motorista
export type StatusTrackingMotorista =
  | 'AGUARDANDO'
  | 'A_CAMINHO'
  | 'NO_LOCAL'
  | 'ROTA_INICIADA'
  | 'ROTA_CONCLUIDA';

// Status de Documento
export type StatusDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO';

// Tipo de Local
export type TipoLocal = 'ESTACAO' | 'CLIENTE' | 'CENTRO_DISTRIBUICAO';

// Interface de Motorista
export interface Motorista {
  id: string;
  nome: string;
  nomeCompleto?: string;
  cpf: string;
  email: string;
  telefone: string;
  celular?: string;
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

// Interface de Historico Tracking Rota
export interface HistoricoTrackingRota {
  id: string;
  rotaId: string;
  motoristaId: string;
  status: StatusTrackingMotorista;
  latitude?: number;
  longitude?: number;
  dispositivo?: string;
  ip?: string;
  observacao?: string;
  createdAt: string;
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
  tipoRota?: 'NORMAL' | 'RESGATE';
  horaInicio?: string;
  horaFim?: string | null;
  tamanhoHoras?: number;
  valorProjetado?: number;
  valorTotalRota?: number;
  cicloRota?: 'CICLO_1' | 'CICLO_2' | 'SAME_DAY' | 'SEM_CICLO' | string;
  tipoVeiculo?: TipoVeiculo;
  local?: Local;
  qtdeParadas?: number;
  qtdePacotes?: number;
  qtdeLocais?: number;
  statusTracking?: StatusTrackingMotorista;
  timestampACaminho?: string;
  timestampNoLocal?: string;
  timestampRotaIniciada?: string;
  timestampRotaConcluida?: string;
  historicosTracking?: HistoricoTrackingRota[];
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
  CARRO_PASSEIO: 'Carro Passeio',
  CARGO_VAN: 'Cargo Van',
  LARGE_VAN: 'Large Van',
};

export const TurnoLabels: Record<Turno, string> = {
  MANHA: 'Manhã (06:00 - 14:00)',
  TARDE: 'Tarde (14:00 - 22:00)',
  NOITE: 'Noite (22:00 - 06:00)',
};

export const StatusRotaLabels: Record<StatusRota, string> = {
  DISPONIVEL: 'Disponível',
  OFERTADA: 'Ofertada',
  ACEITA: 'Aceita',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
  CONFIRMADA: 'Confirmada',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  VALIDADA: 'Validada',
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

export const StatusTrackingMotoristaLabels: Record<StatusTrackingMotorista, string> = {
  AGUARDANDO: 'Aguardando',
  A_CAMINHO: 'À caminho',
  NO_LOCAL: 'No local para carregar',
  ROTA_INICIADA: 'Rota em andamento',
  ROTA_CONCLUIDA: 'Rota concluída',
};
