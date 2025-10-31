// frontend/src/hooks/useResumoDisponibilidade.ts
// ATUALIZADO: Endpoints ajustados para /api/gestao/disponibilidades

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { TipoVeiculo, CicloRota } from '../types/disponibilidade';

interface ResumoCiclo {
  [key: string]: number[]; // TipoVeiculo -> array de 7 dias
  subtotal: number[];
}

interface ResumoData {
  ciclos: {
    [CicloRota.CICLO_1]: ResumoCiclo;
    [CicloRota.CICLO_2]: ResumoCiclo;
    [CicloRota.SAME_DAY]: ResumoCiclo;
  };
  totalGeral: number[];
  totalMotoristas: number;
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
    ciclo: CicloRota;
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
      return response.data.data;
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
        ciclo: selectedCell.ciclo,
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

    const criarLinhaBase = () => Array.from({ length: 7 }, () => 0);

    const criarResumoCiclo = (): ResumoCiclo => ({
      [TipoVeiculo.MOTOCICLETA]: criarLinhaBase(),
      [TipoVeiculo.CARRO_PASSEIO]: criarLinhaBase(),
      [TipoVeiculo.CARGO_VAN]: criarLinhaBase(),
      [TipoVeiculo.LARGE_VAN]: criarLinhaBase(),
      subtotal: criarLinhaBase()
    });

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
      ciclos: {
        [CicloRota.CICLO_1]: criarResumoCiclo(),
        [CicloRota.CICLO_2]: criarResumoCiclo(),
        [CicloRota.SAME_DAY]: criarResumoCiclo()
      },
      totalGeral: criarLinhaBase(),
      totalMotoristas: resumoRaw.totalMotoristas || 0
    };

    // Preencher dados
    Object.entries(resumoRaw.resumo || {}).forEach(([dataStr, tiposVeiculo]: [string, any]) => {
      const diaIndex = datas.indexOf(dataStr);
      if (diaIndex === -1) return;

      Object.entries(tiposVeiculo).forEach(([tipoVeiculo, ciclos]: [string, any]) => {
        Object.entries(ciclos).forEach(([ciclo, quantidade]: [string, any]) => {
          const cicloKey = ciclo as CicloRota;
          const veiculoKey = tipoVeiculo as TipoVeiculo;
          const quantidadeNumerica =
            typeof quantidade === 'number' ? quantidade : Number(quantidade) || 0;

          if (
            cicloKey &&
            resultado.ciclos[cicloKey] &&
            resultado.ciclos[cicloKey][veiculoKey]
          ) {
            resultado.ciclos[cicloKey][veiculoKey][diaIndex] = quantidadeNumerica;
            resultado.ciclos[cicloKey].subtotal[diaIndex] += quantidadeNumerica;
            resultado.totalGeral[diaIndex] += quantidadeNumerica;
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
  const abrirModalMotoristas = (data: string, ciclo: CicloRota, tipoVeiculo: TipoVeiculo) => {
    setSelectedCell({ data, ciclo, tipoVeiculo });
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
