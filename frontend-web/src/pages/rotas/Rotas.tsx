import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, MapPin, Clock, DollarSign, Calendar } from 'lucide-react';
import api from '../../services/api';

// Constante de Tabela de Preços
const TABELA_PRECOS = {
  MOTOCICLETA: 20.00,
  CARRO_PASSEIO: 25.00,
  CARGO_VAN: 30.00,
  LARGE_VAN: 35.00,
};

const VALOR_VEICULO_TRANSPORTADORA = 22.00;
const VALOR_POR_KM = 0.64;

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
  veiculoTransportadora: boolean;
  valorProjetado: number;
  valorTotalRota: number;
  status: string;
  local?: {
    nome: string;
    cidade: string;
  };
  motorista?: {
    nomeCompleto: string;
  };
}

export default function Rotas() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterCiclo, setFilterCiclo] = useState<string>('');
  const [filterDataInicio, setFilterDataInicio] = useState<string>('');
  const [filterDataFim, setFilterDataFim] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Definir filtro de data padrão (hoje e amanhã)
  useEffect(() => {
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    setFilterDataInicio(hoje.toISOString().split('T')[0]);
    setFilterDataFim(amanha.toISOString().split('T')[0]);
  }, []);

  // Buscar rotas com filtros
  const { data: rotas = [], isLoading } = useQuery({
    queryKey: ['rotas', filterDataInicio, filterDataFim],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filterDataInicio) params.append('dataInicio', filterDataInicio);
        if (filterDataFim) params.append('dataFim', filterDataFim);

        const response = await api.get(`/rotas?${params.toString()}`);
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas:', error);
        return [];
      }
    },
    enabled: !!filterDataInicio && !!filterDataFim,
  });

  // Deletar rota
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/rotas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas'] });
    },
  });

  // Filtrar rotas
  const filteredRotas = rotas.filter((r: any) => {
    const matchesSearch = (r.codigoRota || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.local?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || r.status === filterStatus;
    const matchesTipo = !filterTipo || r.tipoVeiculo === filterTipo;
    const matchesCiclo = !filterCiclo || r.cicloRota === filterCiclo;
    return matchesSearch && matchesStatus && matchesTipo && matchesCiclo;
  });

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta rota?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      DISPONIVEL: 'bg-blue-100 text-blue-800',
      OFERTADA: 'bg-yellow-100 text-yellow-800',
      ACEITA: 'bg-green-100 text-green-800',
      EM_ANDAMENTO: 'bg-purple-100 text-purple-800',
      CONCLUIDA: 'bg-gray-100 text-gray-800',
      CANCELADA: 'bg-red-100 text-red-800',
      CONFIRMADA: 'bg-teal-100 text-teal-800',
      VALIDADA: 'bg-emerald-100 text-emerald-800',
    };
    return styles[status as keyof typeof styles] || styles.DISPONIVEL;
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

  const getTipoRotaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      ENTREGA: 'Entrega',
      RESGATE: 'Resgate',
      EXTRA: 'Extra',
    };
    return labels[tipo] || tipo;
  };

  const getCicloLabel = (ciclo: string) => {
    const labels: Record<string, string> = {
      CICLO_1: 'Ciclo 1 (Manhã)',
      CICLO_SPEED: 'Ciclo Speed (Tarde)',
      SAME_DAY: 'Same Day (Noite)',
      SEM_CICLO: 'Sem Ciclo',
    };
    return labels[ciclo] || ciclo;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rotas - Ofertas (D-1)</h1>
          <p className="text-gray-600 mt-1">Gerencie as ofertas de rotas para os motoristas</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nova Oferta de Rota
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por código ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <input
              type="date"
              value={filterDataInicio}
              onChange={(e) => setFilterDataInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <input
              type="date"
              value={filterDataFim}
              onChange={(e) => setFilterDataFim(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="OFERTADA">Ofertada</option>
            <option value="ACEITA">Aceita</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os veículos</option>
            <option value="MOTOCICLETA">Motocicleta</option>
            <option value="CARRO_PASSEIO">Carro de Passeio</option>
            <option value="CARGO_VAN">Cargo Van</option>
            <option value="LARGE_VAN">Large Van</option>
          </select>

          <select
            value={filterCiclo}
            onChange={(e) => setFilterCiclo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os ciclos</option>
            <option value="CICLO_1">Ciclo 1 (Manhã)</option>
            <option value="CICLO_SPEED">Ciclo Speed (Tarde)</option>
            <option value="SAME_DAY">Same Day (Noite)</option>
            <option value="SEM_CICLO">Sem Ciclo</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando rotas...</p>
          </div>
        ) : filteredRotas.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma rota encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Local
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo/Ciclo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Projetado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRotas.map((rota: any) => (
                  <tr key={rota.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {rota.codigoRota || 'Sem código'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getTipoRotaLabel(rota.tipoRota)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="w-4 h-4" />
                        {formatDate(rota.dataRota)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatTime(rota.horaInicio)}
                        {rota.horaFim && ` - ${formatTime(rota.horaFim)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{rota.local?.nome || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{rota.local?.cidade || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getCicloLabel(rota.cicloRota)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rota.tamanhoHoras}h
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getTipoVeiculoLabel(rota.tipoVeiculo)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rota.veiculoTransportadora ? 'Transp.' : 'Próprio'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(rota.valorProjetado)}
                      </div>
                      {((rota.bonusPorHora || 0) > 0 || (rota.bonusFixo || 0) > 0) && (
                        <div className="text-xs text-blue-600">+ bônus</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(rota.status)}`}>
                        {rota.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(rota.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                          title="Editar"
                          disabled={rota.status !== 'DISPONIVEL'}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rota.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Excluir"
                          disabled={rota.status !== 'DISPONIVEL'}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <RotaModal
          rotaId={editingId}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

// Modal de Criação/Edição
function RotaModal({ rotaId, onClose }: { rotaId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEditing = !!rotaId;

  const [formData, setFormData] = useState({
    dataRota: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFim: '',
    tipoVeiculo: 'CARGO_VAN',
    tipoRota: 'ENTREGA',
    cicloRota: 'CICLO_1',
    tamanhoHoras: 8,
    veiculoTransportadora: false,
    bonusPorHora: 0,
    bonusFixo: 0,
    kmProjetado: 50,
    localId: '',
  });

  const [valorCalculado, setValorCalculado] = useState({
    valorHora: 0,
    valorBase: 0,
    totalBonusPorHora: 0,
    bonusKmProjetado: 0,
    valorProjetado: 0,
    valorTotalProjetado: 0,
  });

  // Buscar locais
  const { data: locais = [] } = useQuery({
    queryKey: ['locais'],
    queryFn: async () => {
      const response = await api.get('/locais');
      const dados = response.data?.data?.locais || response.data?.locais || response.data;
      return Array.isArray(dados) ? dados : [];
    },
  });

  // Calcular valores automaticamente
  useEffect(() => {
    const valorHora = formData.veiculoTransportadora 
      ? VALOR_VEICULO_TRANSPORTADORA 
      : TABELA_PRECOS[formData.tipoVeiculo as keyof typeof TABELA_PRECOS];
    
    const valorBase = valorHora * formData.tamanhoHoras;
    const totalBonusPorHora = formData.bonusPorHora * formData.tamanhoHoras;
    const valorProjetado = valorBase + totalBonusPorHora + formData.bonusFixo;
    const bonusKmProjetado = formData.kmProjetado * VALOR_POR_KM;
    const valorTotalProjetado = valorProjetado + bonusKmProjetado;

    setValorCalculado({
      valorHora,
      valorBase,
      totalBonusPorHora,
      bonusKmProjetado,
      valorProjetado,
      valorTotalProjetado,
    });
  }, [
    formData.tipoVeiculo,
    formData.veiculoTransportadora,
    formData.tamanhoHoras,
    formData.bonusPorHora,
    formData.bonusFixo,
    formData.kmProjetado,
  ]);

  // Ajustar ciclo quando mudar tipo de rota
  useEffect(() => {
    if (formData.tipoRota === 'RESGATE') {
      setFormData(prev => ({ ...prev, cicloRota: 'SEM_CICLO' }));
    } else if (formData.cicloRota === 'SEM_CICLO') {
      setFormData(prev => ({ ...prev, cicloRota: 'CICLO_1' }));
    }
  }, [formData.tipoRota]);

  // Buscar dados se estiver editando
  const { data: rotaData } = useQuery({
    queryKey: ['rota', rotaId],
    queryFn: async () => {
      if (!rotaId) return null;
      const response = await api.get(`/rotas/${rotaId}`);
      return response.data?.data || response.data;
    },
    enabled: !!rotaId,
  });

  // Preencher formulário quando carregar dados
  useEffect(() => {
    if (rotaData && isEditing) {
      setFormData({
        dataRota: rotaData.dataRota?.split('T')[0] || new Date().toISOString().split('T')[0],
        horaInicio: rotaData.horaInicio?.substring(0, 5) || '08:00',
        horaFim: rotaData.horaFim?.substring(0, 5) || '',
        tipoVeiculo: rotaData.tipoVeiculo || 'CARGO_VAN',
        tipoRota: rotaData.tipoRota || 'ENTREGA',
        cicloRota: rotaData.cicloRota || 'CICLO_1',
        tamanhoHoras: rotaData.tamanhoHoras || 8,
        veiculoTransportadora: rotaData.veiculoTransportadora || false,
        bonusPorHora: rotaData.bonusPorHora || 0,
        bonusFixo: rotaData.bonusFixo || 0,
        kmProjetado: rotaData.kmProjetado || 50,
        localId: rotaData.localId || '',
      });
    }
  }, [rotaData, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Preparar payload com valores calculados
      const payload = {
        dataRota: new Date(data.dataRota).toISOString(),
        horaInicio: `1970-01-01T${data.horaInicio}:00Z`,
        horaFim: data.horaFim ? `1970-01-01T${data.horaFim}:00Z` : null,
        tipoVeiculo: data.tipoVeiculo,
        tipoRota: data.tipoRota,
        cicloRota: data.cicloRota,
        tamanhoHoras: data.tamanhoHoras,
        veiculoTransportadora: data.veiculoTransportadora,
        valorHora: valorCalculado.valorHora,
        bonusPorHora: data.bonusPorHora,
        bonusFixo: data.bonusFixo,
        valorProjetado: valorCalculado.valorProjetado,
        kmProjetado: data.kmProjetado,
        valorKm: VALOR_POR_KM,
        valorTotalRota: valorCalculado.valorTotalProjetado,
        localId: data.localId,
        status: 'DISPONIVEL', // Status inicial sempre DISPONIVEL
      };

      if (isEditing) {
        return api.put(`/rotas/${rotaId}`, payload);
      }
      return api.post('/rotas', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas'] });
      onClose();
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao salvar rota';
      alert(mensagem);
      console.error('Erro:', error.response?.data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.localId) {
      alert('Selecione um local de origem!');
      return;
    }

    saveMutation.mutate(formData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Oferta de Rota' : 'Nova Oferta de Rota (D-1)'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Data e Horário */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data e Horário</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Rota *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dataRota}
                  onChange={(e) => setFormData({ ...formData, dataRota: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Início *
                </label>
                <input
                  type="time"
                  required
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Fim (opcional)
                </label>
                <input
                  type="time"
                  value={formData.horaFim}
                  onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tipo e Ciclo */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo e Ciclo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Rota *
                </label>
                <select
                  value={formData.tipoRota}
                  onChange={(e) => setFormData({ ...formData, tipoRota: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ENTREGA">Entrega</option>
                  <option value="EXTRA">Extra</option>
                  <option value="RESGATE">Resgate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciclo (Turno) *
                </label>
                <select
                  value={formData.cicloRota}
                  onChange={(e) => setFormData({ ...formData, cicloRota: e.target.value })}
                  disabled={formData.tipoRota === 'RESGATE'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="CICLO_1">Ciclo 1 (Manhã)</option>
                  <option value="CICLO_SPEED">Ciclo Speed (Tarde)</option>
                  <option value="SAME_DAY">Same Day (Noite)</option>
                  <option value="SEM_CICLO">Sem Ciclo</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.tipoRota === 'RESGATE' && 'Rotas de resgate não têm ciclo'}
                </p>
              </div>
            </div>
          </div>

          {/* Local */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Local (Origem/Destino)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local de Origem *
              </label>
              <select
                value={formData.localId}
                onChange={(e) => setFormData({ ...formData, localId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um local</option>
                {locais.map((local: any) => (
                  <option key={local.id} value={local.id}>
                    {local.nome} - {local.cidade}/{local.uf}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Rota milk-run: origem = destino</p>
            </div>
          </div>

          {/* Veículo */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Veículo e Tempo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Veículo *
                </label>
                <select
                  value={formData.tipoVeiculo}
                  onChange={(e) => setFormData({ ...formData, tipoVeiculo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MOTOCICLETA">Motocicleta - {formatCurrency(TABELA_PRECOS.MOTOCICLETA)}/h</option>
                  <option value="CARRO_PASSEIO">Carro - {formatCurrency(TABELA_PRECOS.CARRO_PASSEIO)}/h</option>
                  <option value="CARGO_VAN">Cargo Van - {formatCurrency(TABELA_PRECOS.CARGO_VAN)}/h</option>
                  <option value="LARGE_VAN">Large Van - {formatCurrency(TABELA_PRECOS.LARGE_VAN)}/h</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho da Rota (horas) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="24"
                  step="0.5"
                  value={formData.tamanhoHoras}
                  onChange={(e) => setFormData({ ...formData, tamanhoHoras: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.veiculoTransportadora}
                    onChange={(e) => setFormData({ ...formData, veiculoTransportadora: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Veículo da Transportadora ({formatCurrency(VALOR_VEICULO_TRANSPORTADORA)}/h)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Padrão: veículo próprio do motorista
                </p>
              </div>
            </div>
          </div>

          {/* Bônus */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bônus (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bônus por Hora
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.bonusPorHora}
                  onChange={(e) => setFormData({ ...formData, bonusPorHora: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bônus Fixo
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.bonusFixo}
                  onChange={(e) => setFormData({ ...formData, bonusFixo: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KM Projetado
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.kmProjetado}
                  onChange={(e) => setFormData({ ...formData, kmProjetado: parseInt(e.target.value) || 50 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Cálculo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Valor Projetado da Rota</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor/hora:</span>
                <span className="font-medium">{formatCurrency(valorCalculado.valorHora)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor base ({formData.tamanhoHoras}h):</span>
                <span className="font-medium">{formatCurrency(valorCalculado.valorBase)}</span>
              </div>
              {valorCalculado.totalBonusPorHora > 0 && (
                <div className="flex justify-between text-blue-700">
                  <span>+ Bônus por hora:</span>
                  <span className="font-medium">{formatCurrency(valorCalculado.totalBonusPorHora)}</span>
                </div>
              )}
              {formData.bonusFixo > 0 && (
                <div className="flex justify-between text-blue-700">
                  <span>+ Bônus fixo:</span>
                  <span className="font-medium">{formatCurrency(formData.bonusFixo)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="font-semibold text-gray-900">Valor sem KM:</span>
                <span className="font-bold text-gray-900">{formatCurrency(valorCalculado.valorProjetado)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>+ Bônus KM projetado ({formData.kmProjetado}km):</span>
                <span className="font-medium">{formatCurrency(valorCalculado.bonusKmProjetado)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="font-semibold text-gray-900">Valor Total Projetado:</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(valorCalculado.valorTotalProjetado)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Valor final será calculado no D+1 com KM real rodado
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Oferta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}