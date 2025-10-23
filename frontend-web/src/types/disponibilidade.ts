// frontend/src/types/disponibilidade.ts
// COMPLETO: Todos os types, interfaces e enums necessários

// ============================================
// ENUMS
// ============================================

export enum CicloRota {
  CICLO_1 = 'CICLO_1',      // Manhã/Tarde (7h-17h)
  CICLO_2 = 'CICLO_2',      // Tarde (12h-20h)
  SAME_DAY = 'SAME_DAY'     // Noite (18h-23h)
}

export enum TipoVeiculo {
  MOTOCICLETA = 'MOTOCICLETA',
  CARRO_PASSEIO = 'CARRO_PASSEIO',
  CARGO_VAN = 'CARGO_VAN',
  LARGE_VAN = 'LARGE_VAN'
}

export enum TurnoDisponibilidade {
  MATUTINO = 'MATUTINO',
  VESPERTINO = 'VESPERTINO',
  NOTURNO = 'NOTURNO'
}

// ============================================
// INTERFACES PRINCIPAIS
// ============================================

export interface Disponibilidade {
  id: string;
  motoristaId: string;
  data: Date | string;
  ciclo: CicloRota;
  disponivel: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DisponibilidadeInput {
  data: string; // ISO string
  ciclo: CicloRota;
  disponivel: boolean;
}

// ============================================
// INTERFACES DE RESPOSTA DA API
// ============================================

export interface SemanasResponse {
  semanaCorrente: {
    inicio: string;
    fim: string;
    disponibilidades: Disponibilidade[];
  };
  proximaSemana: {
    inicio: string;
    fim: string;
    disponibilidades: Disponibilidade[];
  };
}

export interface HistoricoDisponibilidade {
  historico: Disponibilidade[];
  estatisticas: {
    totalSlots: number;
    slotsDisponiveis: number;
    slotsIndisponiveis: number;
    taxaDisponibilidade: string;
  };
}

// ============================================
// INTERFACES PARA RESUMO (GESTÃO)
// ============================================

export interface ResumoTurno {
  [key: string]: number[];
  subtotal: number[];
}

export interface ResumoDisponibilidade {
  turnos: {
    [TurnoDisponibilidade.MATUTINO]: ResumoTurno;
    [TurnoDisponibilidade.VESPERTINO]: ResumoTurno;
    [TurnoDisponibilidade.NOTURNO]: ResumoTurno;
  };
  totalGeral: number[];
}

export interface MotoristaDisponivel {
  id: string;
  nomeCompleto: string;
  celular: string;
  cidade: string;
  uf: string;
  tipoVeiculo: TipoVeiculo;
  pontuacao: number;
  nivel: string;
  usuario: {
    email: string;
  };
}

// ============================================
// TYPES AUXILIARES
// ============================================

export type DisponibilidadeMap = Map<string, boolean>; // key: "YYYY-MM-DD_CICLO"

export interface PeriodoSemana {
  inicio: Date;
  fim: Date;
}

// ============================================
// CONSTANTS
// ============================================

export const CICLOS_LABELS: Record<CicloRota, string> = {
  [CicloRota.CICLO_1]: 'Manhã/Tarde',
  [CicloRota.CICLO_2]: 'Tarde',
  [CicloRota.SAME_DAY]: 'Noite'
};

export const CICLOS_HORARIOS: Record<CicloRota, string> = {
  [CicloRota.CICLO_1]: '7h-17h',
  [CicloRota.CICLO_2]: '12h-20h',
  [CicloRota.SAME_DAY]: '18h-23h'
};

export const TIPO_VEICULO_LABELS: Record<TipoVeiculo, string> = {
  [TipoVeiculo.MOTOCICLETA]: 'Motocicleta',
  [TipoVeiculo.CARRO_PASSEIO]: 'Carro de Passeio',
  [TipoVeiculo.CARGO_VAN]: 'Cargo Van',
  [TipoVeiculo.LARGE_VAN]: 'Large Van'
};