// frontend/src/pages/disponibilidade/Disponibilidades.tsx
// CORRIGIDO: Tratamento de erro 404 e estrutura de dados

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, User, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Disponibilidade {
  id: string;
  motoristaId: string;
  data: string;
  ciclo: 'MANHA' | 'TARDE' | 'NOITE';
  disponivel: boolean;
  motorista?: {
    nome: string;
    nomeCompleto: string;
    tipoVeiculo: string;
  };
}

export default function Disponibilidades() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMotorista, setFilterMotorista] = useState('');
  const [filterCiclo, setFilterCiclo] = useState('');
  const [viewMode, setViewMode] = useState<'week' | 'motorista'>('week');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Buscar disponibilidades
  const { data: disponibilidades = [], isLoading, error, refetch } = useQuery({
    queryKey: ['disponibilidades', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      try {
        const response = await api.get('/gestao/disponibilidades', {
          params: {
            dataInicio: format(weekStart, 'yyyy-MM-dd'),
            dataFim: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
          }
        });
        
        // Tratar diferentes estruturas de resposta
        const dados = response.data?.data?.disponibilidades || 
                     response.data?.disponibilidades || 
                     response.data;
        
        return Array.isArray(dados) ? dados : [];
      } catch (error: any) {
        console.error('Erro ao buscar disponibilidades:', error);
        const message = error.response?.data?.message || 'Não foi possível carregar as disponibilidades.';
        throw new Error(message);
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Buscar motoristas para filtro
  const { data: motoristas = [] } = useQuery({
    queryKey: ['motoristas'],
    queryFn: async () => {
      try {
        const response = await api.get('/gestao/motoristas');
        const dados = response.data?.data?.motoristas || response.data?.motoristas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return [];
      }
    },
  });

  const getCicloLabel = (ciclo: string) => {
    const labels = {
      MANHA: 'Manhã (06:00-14:00)',
      TARDE: 'Tarde (14:00-22:00)',
      NOITE: 'Noite (22:00-06:00)',
    };
    return labels[ciclo as keyof typeof labels] || ciclo;
  };

  const getDisponibilidadeStatus = (data: Date, ciclo: string, motoristaId?: string) => {
    const disp = disponibilidades.filter((d: Disponibilidade) => {
      const matchesDate = isSameDay(new Date(d.data), data);
      const matchesCiclo = d.ciclo === ciclo;
      const matchesMotorista = !motoristaId || d.motoristaId === motoristaId;
      return matchesDate && matchesCiclo && matchesMotorista && d.disponivel;
    });
    return disp.length;
  };

  // Renderizar erro
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidades</h1>
          <p className="text-gray-600 mt-1">Visualize a disponibilidade dos motoristas</p>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-lg mb-2">Erro ao carregar disponibilidades</p>
              <p className="text-red-700 mb-4">{(error as Error).message}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disponibilidades</h1>
        <p className="text-gray-600 mt-1">Visualize a disponibilidade dos motoristas</p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Seletor de Semana */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semana
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Motorista */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motorista
            </label>
            <select
              value={filterMotorista}
              onChange={(e) => setFilterMotorista(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os motoristas</option>
              {motoristas.map((m: any) => (
                <option key={m.id || m._id} value={m.id || m._id}>
                  {m.nomeCompleto || m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Ciclo */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciclo
            </label>
            <select
              value={filterCiclo}
              onChange={(e) => setFilterCiclo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os ciclos</option>
              <option value="MANHA">Manhã</option>
              <option value="TARDE">Tarde</option>
              <option value="NOITE">Noite</option>
            </select>
          </div>

          {/* Toggle de Visualização */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Por Semana
            </button>
            <button
              onClick={() => setViewMode('motorista')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'motorista'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Por Motorista
            </button>
          </div>
        </div>
      </div>

      {/* Grade de Disponibilidade Semanal */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              Semana de {format(weekStart, 'dd/MM', { locale: ptBR })} a {format(addDays(weekStart, 6), 'dd/MM/yyyy', { locale: ptBR })}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando disponibilidades...</p>
            </div>
          ) : disponibilidades.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma disponibilidade cadastrada para este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Turno
                    </th>
                    {weekDays.map((day) => (
                      <th key={day.toString()} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <div>{format(day, 'EEE', { locale: ptBR })}</div>
                        <div className="font-semibold text-sm text-gray-900 mt-1">
                          {format(day, 'dd/MM')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {['MANHA', 'TARDE', 'NOITE'].map((ciclo) => {
                    if (filterCiclo && ciclo !== filterCiclo) return null;

                    return (
                      <tr key={ciclo}>
                        <td className="px-4 py-4 font-medium text-gray-900">
                          {getCicloLabel(ciclo)}
                        </td>
                        {weekDays.map((day) => {
                          const count = getDisponibilidadeStatus(day, ciclo, filterMotorista);
                          return (
                            <td key={day.toString()} className="px-4 py-4 text-center">
                              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                                count > 0
                                  ? count >= 5
                                    ? 'bg-green-100 text-green-800'
                                    : count >= 3
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                <span className="font-semibold">{count}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legenda */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-100"></div>
                <span className="text-gray-600">5+ motoristas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-100"></div>
                <span className="text-gray-600">3-4 motoristas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-100"></div>
                <span className="text-gray-600">1-2 motoristas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-100"></div>
                <span className="text-gray-600">Nenhum motorista</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualização por Motorista */}
      {viewMode === 'motorista' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {motoristas
            .filter((m: any) => !filterMotorista || (m.id || m._id) === filterMotorista)
            .map((motorista: any) => {
              const motoristaDisp = disponibilidades.filter(
                (d: Disponibilidade) => d.motoristaId === (motorista.id || motorista._id)
              );

              return (
                <div key={motorista.id || motorista._id} className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{motorista.nomeCompleto || motorista.nome}</h3>
                        <p className="text-sm text-gray-500">{motorista.tipoVeiculo}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {weekDays.map((day) => {
                      const dayDisp = motoristaDisp.filter((d: Disponibilidade) =>
                        isSameDay(new Date(d.data), day)
                      );

                      return (
                        <div key={day.toString()} className="mb-3 last:mb-0">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            {format(day, 'EEEE, dd/MM', { locale: ptBR })}
                          </div>
                          <div className="flex gap-2">
                            {['MANHA', 'TARDE', 'NOITE'].map((ciclo) => {
                              const isDisp = dayDisp.some(
                                (d: Disponibilidade) => d.ciclo === ciclo && d.disponivel
                              );

                              if (filterCiclo && ciclo !== filterCiclo) return null;

                              return (
                                <div
                                  key={ciclo}
                                  className={`flex-1 px-3 py-2 rounded-lg text-center text-sm ${
                                    isDisp
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {ciclo === 'MANHA' ? 'M' : ciclo === 'TARDE' ? 'T' : 'N'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
