import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Calendar, Clock, MapPin, DollarSign, User, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

interface Motorista {
  id: string;
  nomeCompleto: string;
  tipoVeiculo: string;
  status: string;
  disponibilidades?: Array<{
    data: string;
    turno: string;
    disponivel: boolean;
  }>;
}

interface Rota {
  id: string;
  dataRota: string;
  horaInicio: string;
  horaFim?: string;
  codigoRota?: string;
  tipoVeiculo: string;
  tipoRota: string;
  cicloRota: string;
  tamanhoHoras: number;
  valorProjetado: number;
  status: string;
  local?: {
    nome: string;
    cidade: string;
  };
}

interface Alocacao {
  rotaId: string;
  motoristaId: string;
}

export default function RotasAlocacao() {
  const queryClient = useQueryClient();
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [filterData, setFilterData] = useState<string>('');

  // Definir filtro de data padrão (hoje e amanhã)
  useEffect(() => {
    const hoje = new Date();
    setFilterData(hoje.toISOString().split('T')[0]);
  }, []);

  // Buscar rotas disponíveis
  const { data: rotas = [], isLoading: loadingRotas } = useQuery({
    queryKey: ['rotas-disponiveis', filterData],
    queryFn: async () => {
      try {
        const hoje = new Date(filterData);
        const amanha = new Date(filterData);
        amanha.setDate(amanha.getDate() + 1);

        const params = new URLSearchParams({
          status: 'DISPONIVEL',
          dataInicio: hoje.toISOString().split('T')[0],
          dataFim: amanha.toISOString().split('T')[0],
        });

        const response = await api.get(`/rotas?${params.toString()}`);
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas:', error);
        return [];
      }
    },
    enabled: !!filterData,
  });

  // Buscar motoristas ativos
  const { data: motoristas = [], isLoading: loadingMotoristas } = useQuery({
    queryKey: ['motoristas-ativos'],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ status: 'ATIVO' });
        const response = await api.get(`/motoristas?${params.toString()}`);
        const dados = response.data?.data?.motoristas || response.data?.motoristas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return [];
      }
    },
  });

  // Buscar disponibilidades dos motoristas
  const { data: disponibilidades = [] } = useQuery({
    queryKey: ['disponibilidades', filterData],
    queryFn: async () => {
      if (!filterData) return [];
      try {
        const hoje = new Date(filterData);
        const amanha = new Date(filterData);
        amanha.setDate(amanha.getDate() + 1);

        const params = new URLSearchParams({
          dataInicio: hoje.toISOString().split('T')[0],
          dataFim: amanha.toISOString().split('T')[0],
        });

        const response = await api.get(`/disponibilidades?${params.toString()}`);
        const dados = response.data?.data?.disponibilidades || response.data?.disponibilidades || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar disponibilidades:', error);
        return [];
      }
    },
    enabled: !!filterData,
  });

  // Enviar ofertas de rotas
  const enviarOfertasMutation = useMutation({
    mutationFn: async (alocacoes: Alocacao[]) => {
      // Enviar cada alocação para o backend
      const promises = alocacoes.map(async (alocacao) => {
        return api.post('/ofertas-rotas', {
          rotaId: alocacao.rotaId,
          motoristaId: alocacao.motoristaId,
        });
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      alert('Ofertas enviadas com sucesso aos motoristas!');
      setAlocacoes([]);
      queryClient.invalidateQueries({ queryKey: ['rotas-disponiveis'] });
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao enviar ofertas';
      alert(mensagem);
      console.error('Erro:', error.response?.data);
    },
  });

  // Verificar se motorista tem disponibilidade para a rota
  const motoristaTemDisponibilidade = (motoristaId: string, dataRota: string, ciclo: string): boolean => {
    const dataRotaObj = new Date(dataRota);
    const dataRotaStr = dataRotaObj.toISOString().split('T')[0];

    // Mapear ciclo para turno
    const turnoMap: Record<string, string> = {
      CICLO_1: 'MATUTINO',
      CICLO_2: 'VESPERTINO',
      SAME_DAY: 'NOTURNO',
      SEM_CICLO: 'MATUTINO', // Padrão
    };

    const turno = turnoMap[ciclo] || 'MATUTINO';

    // Buscar disponibilidade do motorista
    const disponibilidade = disponibilidades.find(
      (d: any) =>
        d.motoristaId === motoristaId &&
        new Date(d.data).toISOString().split('T')[0] === dataRotaStr &&
        d.turno === turno &&
        d.disponivel === true
    );

    return !!disponibilidade;
  };

  // Filtrar motoristas elegíveis para uma rota
  const getMotoristasPorRota = (rota: Rota): Motorista[] => {
    // IDs dos motoristas já alocados
    const motoristasAlocados = alocacoes.map((a) => a.motoristaId);

    return motoristas.filter((m: any) => {
      // Verificar se já foi alocado
      if (motoristasAlocados.includes(m.id)) return false;

      // Verificar se o tipo de veículo é compatível
      if (m.tipoVeiculo !== rota.tipoVeiculo) return false;

      // Verificar se está ativo
      if (m.status !== 'ATIVO') return false;

      // Verificar disponibilidade
      if (!motoristaTemDisponibilidade(m.id, rota.dataRota, rota.cicloRota)) return false;

      return true;
    });
  };

  // Alocar motorista a uma rota
  const handleAlocar = (rotaId: string, motoristaId: string) => {
    if (!motoristaId) {
      // Remover alocação se desmarcar
      setAlocacoes((prev) => prev.filter((a) => a.rotaId !== rotaId));
      return;
    }

    // Adicionar ou atualizar alocação
    setAlocacoes((prev) => {
      const existente = prev.find((a) => a.rotaId === rotaId);
      if (existente) {
        return prev.map((a) => (a.rotaId === rotaId ? { rotaId, motoristaId } : a));
      }
      return [...prev, { rotaId, motoristaId }];
    });
  };

  // Enviar ofertas
  const handleEnviarOfertas = () => {
    if (alocacoes.length === 0) {
      alert('Nenhuma rota foi alocada!');
      return;
    }

    if (window.confirm(`Deseja enviar ${alocacoes.length} oferta(s) aos motoristas?`)) {
      enviarOfertasMutation.mutate(alocacoes);
    }
  };

  const getTipoVeiculoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      MOTOCICLETA: 'Motocicleta',
      CARRO_PASSEIO: 'Carro Passeio',
      CARGO_VAN: 'Cargo Van',
      LARGE_VAN: 'Large Van',
    };
    return labels[tipo] || tipo;
  };

  const getCicloLabel = (ciclo: string) => {
    const labels: Record<string, string> = {
      CICLO_1: 'Ciclo 1 (Manhã)',
      CICLO_2: 'Ciclo 2 (Tarde)',
      SAME_DAY: 'Same Day (Noite)',
      SEM_CICLO: 'Sem Ciclo',
    };
    return labels[ciclo] || ciclo;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const isLoading = loadingRotas || loadingMotoristas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alocação de Rotas (D-1)</h1>
          <p className="text-gray-600 mt-1">Aloque motoristas às rotas disponíveis para enviar ofertas</p>
        </div>
        <button
          onClick={handleEnviarOfertas}
          disabled={alocacoes.length === 0 || enviarOfertasMutation.isPending}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          Enviar Ofertas ({alocacoes.length})
        </button>
      </div>

      {/* Filtro de Data */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Data de Referência:</label>
          <input
            type="date"
            value={filterData}
            onChange={(e) => setFilterData(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-600">
            (Mostra rotas para hoje e amanhã a partir desta data)
          </span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium">Rotas Disponíveis</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{rotas.length}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Motoristas Ativos</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{motoristas.length}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Rotas Alocadas</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{alocacoes.length}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{rotas.length - alocacoes.length}</p>
        </div>
      </div>

      {/* Lista de Rotas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados...</p>
          </div>
        ) : rotas.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma rota disponível para alocação</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rotas.map((rota: any) => {
              const motoristasElegiveis = getMotoristasPorRota(rota);
              const alocacao = alocacoes.find((a) => a.rotaId === rota.id);

              return (
                <div key={rota.id} className="p-6 hover:bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Informações da Rota */}
                    <div className="lg:col-span-7">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {rota.codigoRota || 'Sem código'}
                          </h3>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(rota.dataRota)}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>
                                {formatTime(rota.horaInicio)}
                                {rota.horaFim && ` - ${formatTime(rota.horaFim)}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {rota.local?.nome || 'N/A'} - {rota.local?.cidade || ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                {getCicloLabel(rota.cicloRota)}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {getTipoVeiculoLabel(rota.tipoVeiculo)}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                {rota.tamanhoHoras}h
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-green-600 mt-2">
                              <DollarSign className="w-4 h-4" />
                              {formatCurrency(rota.valorProjetado)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seleção de Motorista */}
                    <div className="lg:col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecionar Motorista
                      </label>
                      <select
                        value={alocacao?.motoristaId || ''}
                        onChange={(e) => handleAlocar(rota.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Selecione um motorista --</option>
                        {motoristasElegiveis.map((motorista: any) => (
                          <option key={motorista.id} value={motorista.id}>
                            {motorista.nomeCompleto} - {getTipoVeiculoLabel(motorista.tipoVeiculo)}
                          </option>
                        ))}
                      </select>
                      {motoristasElegiveis.length === 0 && (
                        <p className="mt-2 text-xs text-red-600">
                          ⚠️ Nenhum motorista elegível (verificar tipo de veículo e disponibilidade)
                        </p>
                      )}
                      {alocacao && (
                        <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Motorista alocado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo de Alocações */}
      {alocacoes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">Resumo de Alocações</h3>
          <div className="space-y-2">
            {alocacoes.map((alocacao) => {
              const rota = rotas.find((r: any) => r.id === alocacao.rotaId);
              const motorista = motoristas.find((m: any) => m.id === alocacao.motoristaId);
              
              return (
                <div key={alocacao.rotaId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    <strong>{rota?.codigoRota || 'Sem código'}</strong> - {formatDate(rota?.dataRota || '')}
                  </span>
                  <span className="text-green-700 font-medium">→ {motorista?.nomeCompleto}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}