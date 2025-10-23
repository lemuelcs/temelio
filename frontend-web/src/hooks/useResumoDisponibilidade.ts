// frontend/src/hooks/useResumoDisponibilidade.ts
// ATUALIZADO: Endpoints ajustados para /api/gestao/disponibilidades

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { TurnoDisponibilidade, TipoVeiculo } from '../types/disponibilidade';

interface ResumoTurno {
  [key: string]: number[]; // TipoVeiculo -> array de 7 dias
  subtotal: number[];
}

interface ResumoData {
  turnos: {
    [TurnoDisponibilidade.MATUTINO]: ResumoTurno;
    [TurnoDisponibilidade.VESPERTINO]: ResumoTurno;
    [TurnoDisponibilidade.NOTURNO]: ResumoTurno;
  };
  totalGeral: number[];
}

interface MotoristaDisponivel {
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

export function useResumoDisponibilidade(dataInicio: string, dataFim: string) {
  const [selectedCell, setSelectedCell] = useState<{
    data: string;
    turno: TurnoDisponibilidade;
    tipoVeiculo: TipoVeiculo;
  } | null>(null);

  /**
   * Buscar resumo consolidado
   */
  const {
    data: resumoRaw,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['resumo-disponibilidade', dataInicio, dataFim],
    queryFn: async () => {
      const response = await api.get('/gestao/disponibilidades/resumo', {
        params: { dataInicio, dataFim }
      });
      return response.data.data.resumo;
    },
    enabled: !!dataInicio && !!dataFim
  });

  /**
   * Buscar motoristas disponíveis para célula específica
   */
  const {
    data: motoristas,
    isLoading: isLoadingMotoristas
  } = useQuery<MotoristaDisponivel[]>({
    queryKey: ['motoristas-disponiveis', selectedCell],
    queryFn: async () => {
      if (!selectedCell) return [];
      
      const response = await api.post('/gestao/disponibilidades/buscar-motoristas', {
        data: selectedCell.data,
        turno: selectedCell.turno,
        tipoVeiculo: selectedCell.tipoVeiculo
      });
      
      return response.data.data.motoristas;
    },
    enabled: !!selectedCell
  });

  /**
   * Processar dados brutos do backend em estrutura organizada por turno
   */
  const processarResumo = (): ResumoData | null => {
    if (!resumoRaw) return null;

    // Gerar array de datas (7 dias)
    const inicio = new Date(dataInicio);
    const datas: string[] = [];
    for (let i = 0; i < 7; i++) {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + i);
      datas.push(data.toISOString().split('T')[0]);
    }

    // Inicializar estrutura
    const resultado: ResumoData = {
      turnos: {
        [TurnoDisponibilidade.MATUTINO]: {
          [TipoVeiculo.MOTOCICLETA]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.CARRO_PASSEIO]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.CARGO_VAN]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.LARGE_VAN]: [0, 0, 0, 0, 0, 0, 0],
          subtotal: [0, 0, 0, 0, 0, 0, 0]
        },
        [TurnoDisponibilidade.VESPERTINO]: {
          [TipoVeiculo.MOTOCICLETA]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.CARRO_PASSEIO]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.CARGO_VAN]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.LARGE_VAN]: [0, 0, 0, 0, 0, 0, 0],
          subtotal: [0, 0, 0, 0, 0, 0, 0]
        },
        [TurnoDisponibilidade.NOTURNO]: {
          [TipoVeiculo.MOTOCICLETA]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.CARRO_PASSEIO]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.CARGO_VAN]: [0, 0, 0, 0, 0, 0, 0],
          [TipoVeiculo.LARGE_VAN]: [0, 0, 0, 0, 0, 0, 0],
          subtotal: [0, 0, 0, 0, 0, 0, 0]
        }
      },
      totalGeral: [0, 0, 0, 0, 0, 0, 0]
    };

    // Preencher dados
    Object.entries(resumoRaw).forEach(([dataStr, tiposVeiculo]: [string, any]) => {
      const diaIndex = datas.indexOf(dataStr);
      if (diaIndex === -1) return;

      Object.entries(tiposVeiculo).forEach(([tipoVeiculo, turnos]: [string, any]) => {
        Object.entries(turnos).forEach(([turno, quantidade]: [string, any]) => {
          const turnoKey = turno as TurnoDisponibilidade;
          const veiculoKey = tipoVeiculo as TipoVeiculo;
          
          if (resultado.turnos[turnoKey] && resultado.turnos[turnoKey][veiculoKey]) {
            resultado.turnos[turnoKey][veiculoKey][diaIndex] = quantidade;
            resultado.turnos[turnoKey].subtotal[diaIndex] += quantidade;
            resultado.totalGeral[diaIndex] += quantidade;
          }
        });
      });
    });

    return resultado;
  };

  const resumo = processarResumo();

  /**
   * Abrir modal de motoristas
   */
  const abrirModalMotoristas = (data: string, turno: TurnoDisponibilidade, tipoVeiculo: TipoVeiculo) => {
    setSelectedCell({ data, turno, tipoVeiculo });
  };

  /**
   * Fechar modal
   */
  const fecharModalMotoristas = () => {
    setSelectedCell(null);
  };

  return {
    resumo,
    isLoading,
    error,
    refetch,
    motoristas,
    isLoadingMotoristas,
    selectedCell,
    abrirModalMotoristas,
    fecharModalMotoristas
  };
}
