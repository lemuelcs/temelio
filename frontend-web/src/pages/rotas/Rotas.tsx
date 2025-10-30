import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, MapPin, Clock, DollarSign, Calendar, ListPlus, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../../services/api';

// Ajuste padrão para ícones do Leaflet no Vite/React
const defaultLeafletIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

if (typeof window !== 'undefined') {
  L.Marker.prototype.options.icon = defaultLeafletIcon;
}

// Valores padrão (fallback se não conseguir buscar do BD)
const VALORES_PADRAO = {
  MOTOCICLETA: 27.0,
  CARRO_PASSEIO: 37.0,
  CARGO_VAN: 40.0,
  LARGE_VAN: 52.5,
  TRANSPORTADORA: 25.0,
  KM: 0.64,
};

// Mapeamento entre tipos de veículo do frontend e tipos de serviço da API
const TIPO_VEICULO_TO_SERVICO: Record<string, string[]> = {
  MOTOCICLETA: ['BIKE'],
  CARRO_PASSEIO: ['PASSENGER'],
  CARGO_VAN: ['CARGO_VAN', 'SMALL_VAN'],
  LARGE_VAN: ['LARGE_VAN'],
};

const TIPOS_SERVICO_PERMITIDOS = new Set(['BIKE', 'PASSENGER', 'CARGO_VAN', 'SMALL_VAN', 'LARGE_VAN']);

const DEFAULT_MAP_CENTER: [number, number] = [-23.55052, -46.633308];

const toLocalDateInput = (date: Date) => {
  const offsetInMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetInMs).toISOString().split('T')[0];
};

const formatDatePtBr = (dateString: string) => {
  if (!dateString) return '-';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(parsed);
};

const parseNumberOrNull = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const numeric = Number(trimmed);
    return Number.isNaN(numeric) ? null : numeric;
  }

  return Number.isNaN(value) ? null : Number(value);
};

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
  qtdeParadas?: number | null;
  qtdeLocais?: number | null;
  qtdePacotes?: number | null;
  latitudeOrigem?: number | null;
  longitudeOrigem?: number | null;
}

type TabelaPrecosProcessada = {
  precos: Record<string, Record<string, { valorHora: number; tabelaId: string | null }>>;
  valorKm: number;
};

interface RotaFormData {
  dataRota: string;
  horaInicio: string;
  horaFim: string;
  tipoVeiculo: string;
  tipoRota: string;
  cicloRota: string;
  tamanhoHoras: number;
  veiculoTransportadora: boolean;
  bonusPorHora: number;
  bonusFixo: number;
  kmProjetado: number;
  localId: string;
  latitudeOrigem: string;
  longitudeOrigem: string;
  resgateRotaId: string;
  codigoRota: string;
  qtdeParadas: string;
  qtdeLocais: string;
  qtdePacotes: string;
}

const toHourMinute = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().substring(11, 16);
  }

  if (typeof value === 'string' && value.includes(':')) {
    return value.substring(0, 5);
  }

  return '';
};

function ResgateLocationSelector({
  position,
  onSelect,
}: {
  position: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  const LocationMarker = () => {
    const map = useMapEvents({
      click(event) {
        onSelect(event.latlng.lat, event.latlng.lng);
      },
    });

    useEffect(() => {
      if (position) {
        map.setView(position);
      }
    }, [position, map]);

    return position ? <Marker position={position} /> : null;
  };

  const center = position ?? DEFAULT_MAP_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker />
    </MapContainer>
  );
}

export default function Rotas() {
  const [showModal, setShowModal] = useState(false);
  const [showLoteModal, setShowLoteModal] = useState(false);
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
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    setFilterDataInicio(toLocalDateInput(hoje));
    setFilterDataFim(toLocalDateInput(amanha));
  }, []);

  // Buscar tabela de preços da estação DBS5
  const {
    data: tabelaPrecos = null,
    isLoading: carregandoTabelaPrecos,
    isError: erroTabelaPrecos,
  } = useQuery({
    queryKey: ['tabela-precos-dbs5'],
    queryFn: async () => {
      try {
        // Buscar todas as tabelas de preços ativas da estação DBS5
        const response = await api.get('/tabela-precos', {
          params: {
            estacao: 'DBS5',
            ativo: 'true'
          }
        });

        const tabelas = response.data?.data?.tabelas || response.data?.tabelas || [];

        // Criar mapa de preços por tipoServico e propriedade
        const precosMap: Record<
          string,
          Record<string, { valorHora: number; tabelaId: string | null }>
        > = {};
        let valorKmPadrao: number | null = null;

        tabelas.forEach((tabela: any) => {
          const tipoServico = tabela.tipoServico || tabela.tipoVeiculo;
          const propriedade = tabela.propriedade || tabela.propriedadeVeiculo;

          if (!tipoServico || !propriedade) {
            return;
          }

          if (!TIPOS_SERVICO_PERMITIDOS.has(tipoServico)) {
            return;
          }

          if (!precosMap[tipoServico]) {
            precosMap[tipoServico] = {};
          }

          const valorHora = tabela.valorHora ?? tabela.valorHoraDSP;
          const valorHoraNumber = valorHora ? parseFloat(valorHora) : 0;
          precosMap[tipoServico][propriedade] = {
            valorHora: valorHoraNumber,
            tabelaId: tabela.id || null,
          };

          if (valorKmPadrao === null) {
            const valorKm = tabela.valorKm ?? tabela.valorAjudaCombustivel;
            if (valorKm !== undefined && valorKm !== null) {
              valorKmPadrao = parseFloat(valorKm);
            }
          }
        });

        return {
          precos: precosMap,
          valorKm: valorKmPadrao ?? VALORES_PADRAO.KM
        };
      } catch (error) {
        console.error('Erro ao buscar tabela de preços:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

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
      CICLO_2: 'Ciclo 2 (Tarde)',
      SAME_DAY: 'Same Day (Noite)',
      SAMEDAY: 'Same Day (Noite)',
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

  const formatDate = (dateString: string) => formatDatePtBr(dateString);

  const formatTime = (timeString: string) => toHourMinute(timeString);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rotas - Ofertas (D-1)</h1>
          <p className="text-gray-600 mt-1">Gerencie as ofertas de rotas para os motoristas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLoteModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <ListPlus className="w-5 h-5" />
            Adicionar Rotas em Lote
          </button>
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
      </div>

      {erroTabelaPrecos && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">Não foi possível carregar a tabela de preços da estação DBS5.</p>
          <p className="text-xs mt-1">As rotas podem apresentar valores padrão. Tente recarregar a página ou verifique o backend.</p>
        </div>
      )}

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
            <option value="CICLO_2">Ciclo 2 (Tarde)</option>
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
                      {typeof rota.qtdeParadas === 'number' && (
                        <div className="text-xs text-gray-500 mt-1">
                          Paradas: {rota.qtdeParadas}
                        </div>
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
          tabelaPrecos={tabelaPrecos}
          carregandoTabelaPrecos={carregandoTabelaPrecos}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
        />
      )}

      {/* Modal de Rotas em Lote */}
      {showLoteModal && (
        <RotasLoteModal
          tabelaPrecos={tabelaPrecos}
          carregandoTabelaPrecos={carregandoTabelaPrecos}
          onClose={() => setShowLoteModal(false)}
        />
      )}
    </div>
  );
}

// Modal de Criação/Edição
function RotaModal({
  rotaId,
  tabelaPrecos,
  carregandoTabelaPrecos,
  onClose,
}: {
  rotaId: string | null;
  tabelaPrecos: TabelaPrecosProcessada | null;
  carregandoTabelaPrecos: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!rotaId;

  const findTabelaInfo = (tipoVeiculo: string, veiculoTransportadora: boolean) => {
    if (!tabelaPrecos) {
      return null;
    }

    const tiposServicoPossiveis = TIPO_VEICULO_TO_SERVICO[tipoVeiculo] || [];
    const propriedade = veiculoTransportadora ? 'TRANSPORTADORA' : 'PROPRIO';

    for (const tipoServico of tiposServicoPossiveis) {
      const info = tabelaPrecos.precos?.[tipoServico]?.[propriedade];
      if (info && info.valorHora > 0) {
        return {
          ...info,
          tipoServico,
          propriedade,
        };
      }
    }

    return null;
  };

  // Função para obter valor da tabela de preços
  const getValorHora = (tipoVeiculo: string, veiculoTransportadora: boolean): number => {
    if (!tabelaPrecos) {
      // Fallback para valores padrão
      if (veiculoTransportadora) return VALORES_PADRAO.TRANSPORTADORA;
      return VALORES_PADRAO[tipoVeiculo as keyof typeof VALORES_PADRAO] || 0;
    }

    const infoEncontrada = findTabelaInfo(tipoVeiculo, veiculoTransportadora);
    if (infoEncontrada) {
      return infoEncontrada.valorHora;
    }

    return VALORES_PADRAO[tipoVeiculo as keyof typeof VALORES_PADRAO] || 0;
  };

  const getValorKm = (): number => {
    return tabelaPrecos?.valorKm || VALORES_PADRAO.KM;
  };

  const [formData, setFormData] = useState<RotaFormData>({
    dataRota: toLocalDateInput(new Date()),
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
    latitudeOrigem: '',
    longitudeOrigem: '',
    resgateRotaId: '',
    codigoRota: '',
    qtdeParadas: '',
    qtdeLocais: '',
    qtdePacotes: '',
  });

  const resgatePosition = useMemo<[number, number] | null>(() => {
    const lat = parseNumberOrNull(formData.latitudeOrigem);
    const lng = parseNumberOrNull(formData.longitudeOrigem);
    if (lat === null || lng === null) {
      return null;
    }
    return [lat, lng];
  }, [formData.latitudeOrigem, formData.longitudeOrigem]);

  const [valorCalculado, setValorCalculado] = useState({
    valorHora: 0,
    valorBase: 0,
    totalBonusPorHora: 0,
    bonusKmProjetado: 0,
    valorProjetado: 0,
    valorTotalProjetado: 0,
    valorKmReferencia: 0,
    tabelaPrecosId: null as string | null,
    tipoServicoAplicado: '',
    propriedadeAplicada: '',
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

  const isResgate = formData.tipoRota === 'RESGATE';

  const {
    data: rotasEmAndamento = [],
    isLoading: carregandoRotasEmAndamento,
  } = useQuery({
    queryKey: ['rotas-em-andamento'],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ status: 'EM_ANDAMENTO' });
        const response = await api.get(`/rotas?${params.toString()}`);
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas em andamento:', error);
        return [];
      }
    },
    enabled: isResgate,
    staleTime: 60 * 1000,
  });

  // Calcular valores automaticamente
  useEffect(() => {
    const infoTabela = findTabelaInfo(formData.tipoVeiculo, formData.veiculoTransportadora);
    const valorHora = infoTabela?.valorHora ?? getValorHora(formData.tipoVeiculo, formData.veiculoTransportadora);
    const valorKm = getValorKm();

    const valorBase = valorHora * formData.tamanhoHoras;
    const totalBonusPorHora = formData.bonusPorHora * formData.tamanhoHoras;
    const valorProjetado = valorBase + totalBonusPorHora + formData.bonusFixo;
    const bonusKmProjetado = formData.kmProjetado * valorKm;
    const valorTotalProjetado = valorProjetado + bonusKmProjetado;

    setValorCalculado({
      valorHora,
      valorBase,
      totalBonusPorHora,
      bonusKmProjetado,
      valorProjetado,
      valorTotalProjetado,
      valorKmReferencia: valorKm,
      tabelaPrecosId: infoTabela?.tabelaId ?? null,
      tipoServicoAplicado: infoTabela?.tipoServico ?? '',
      propriedadeAplicada: infoTabela?.propriedade ?? (formData.veiculoTransportadora ? 'TRANSPORTADORA' : 'PROPRIO'),
    });
  }, [
    formData.tipoVeiculo,
    formData.veiculoTransportadora,
    formData.tamanhoHoras,
    formData.bonusPorHora,
    formData.bonusFixo,
    formData.kmProjetado,
    tabelaPrecos,
  ]);

  // Ajustar ciclo e campos auxiliares quando mudar tipo de rota
  useEffect(() => {
    if (formData.tipoRota === 'RESGATE' && formData.cicloRota !== 'SEM_CICLO') {
      setFormData(prev => ({ ...prev, cicloRota: 'SEM_CICLO' }));
      return;
    }

    if (formData.tipoRota !== 'RESGATE' && formData.cicloRota === 'SEM_CICLO') {
      setFormData(prev => ({
        ...prev,
        cicloRota: 'CICLO_1',
        resgateRotaId: '',
        latitudeOrigem: '',
        longitudeOrigem: '',
        qtdeParadas: '',
        qtdeLocais: '',
        qtdePacotes: '',
      }));
    }
  }, [formData.tipoRota, formData.cicloRota]);

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
        dataRota: rotaData.dataRota ? toLocalDateInput(new Date(rotaData.dataRota)) : toLocalDateInput(new Date()),
        horaInicio: toHourMinute(rotaData.horaInicio) || '08:00',
        horaFim: toHourMinute(rotaData.horaFim),
        tipoVeiculo: rotaData.tipoVeiculo || 'CARGO_VAN',
        tipoRota: rotaData.tipoRota || 'ENTREGA',
        cicloRota: rotaData.cicloRota || 'CICLO_1',
        tamanhoHoras: rotaData.tamanhoHoras || 8,
        veiculoTransportadora: rotaData.veiculoTransportadora || false,
        bonusPorHora: rotaData.bonusPorHora || 0,
        bonusFixo: rotaData.bonusFixo || 0,
        kmProjetado: rotaData.kmProjetado || 50,
        localId: rotaData.localId || '',
        latitudeOrigem: rotaData.latitudeOrigem !== null && rotaData.latitudeOrigem !== undefined ? String(rotaData.latitudeOrigem) : '',
        longitudeOrigem: rotaData.longitudeOrigem !== null && rotaData.longitudeOrigem !== undefined ? String(rotaData.longitudeOrigem) : '',
        resgateRotaId: '',
        codigoRota: rotaData.codigoRota || '',
        qtdeParadas: rotaData.qtdeParadas !== null && rotaData.qtdeParadas !== undefined ? String(rotaData.qtdeParadas) : '',
        qtdeLocais: rotaData.qtdeLocais !== null && rotaData.qtdeLocais !== undefined ? String(rotaData.qtdeLocais) : '',
        qtdePacotes: rotaData.qtdePacotes !== null && rotaData.qtdePacotes !== undefined ? String(rotaData.qtdePacotes) : '',
      });
    }
  }, [rotaData, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const latitude = parseNumberOrNull(data.latitudeOrigem);
      const longitude = parseNumberOrNull(data.longitudeOrigem);
      const qtdeParadas = parseNumberOrNull(data.qtdeParadas);
      const qtdeLocais = parseNumberOrNull(data.qtdeLocais);
      const qtdePacotes = parseNumberOrNull(data.qtdePacotes);
      const codigoRotaNormalizado = data.codigoRota?.trim?.() || '';

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
        valorKm: valorCalculado.valorKmReferencia,
        valorTotalRota: valorCalculado.valorTotalProjetado,
        localId: data.localId,
        latitudeOrigem: latitude,
        longitudeOrigem: longitude,
        qtdeParadas,
        qtdeLocais,
        qtdePacotes,
        codigoRota: codigoRotaNormalizado ? codigoRotaNormalizado : null,
        resgateRotaId: data.resgateRotaId || null,
        tabelaPrecosId: valorCalculado.tabelaPrecosId,
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

    const latitude = parseNumberOrNull(formData.latitudeOrigem);
    const longitude = parseNumberOrNull(formData.longitudeOrigem);
    const qtdeParadas = parseNumberOrNull(formData.qtdeParadas);
    const qtdeLocais = parseNumberOrNull(formData.qtdeLocais);
    const qtdePacotes = parseNumberOrNull(formData.qtdePacotes);

    if (formData.qtdeParadas.trim() && qtdeParadas === null) {
      alert('Quantidade de paradas inválida. Utilize apenas números.');
      return;
    }

    if (formData.qtdeLocais.trim() && qtdeLocais === null) {
      alert('Quantidade de locais inválida. Utilize apenas números.');
      return;
    }

    if (formData.qtdePacotes.trim() && qtdePacotes === null) {
      alert('Quantidade de pacotes inválida. Utilize apenas números.');
      return;
    }

    if (formData.tipoRota === 'RESGATE') {
      if (!formData.resgateRotaId) {
        alert('Selecione a rota em andamento que será resgatada.');
        return;
      }

      if (!formData.qtdeParadas.trim()) {
        alert('Informe a quantidade de paradas que será resgatada.');
        return;
      }

      if (!formData.codigoRota.trim()) {
        alert('Informe um código para identificar a oferta de resgate.');
        return;
      }

      if (latitude === null || longitude === null) {
        alert('Marque a localização de origem no mapa para rotas de resgate.');
        return;
      }
    }

    if (carregandoTabelaPrecos) {
      alert('Aguarde o carregamento da tabela de preços antes de salvar.');
      return;
    }

    const tabelaInfo = findTabelaInfo(formData.tipoVeiculo, formData.veiculoTransportadora);
    if (!tabelaInfo) {
      alert('Não encontramos tabela de preços vigente para esta combinação de veículo e propriedade. Verifique a tabela de preços da estação DBS5.');
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
                  <option value="CICLO_2">Ciclo 2 (Tarde)</option>
                  <option value="SAME_DAY">Same Day (Noite)</option>
                  <option value="SEM_CICLO">Sem Ciclo</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.tipoRota === 'RESGATE' && 'Rotas de resgate não têm ciclo'}
                </p>
              </div>
          </div>
        </div>

          {formData.tipoRota === 'RESGATE' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Configurações do Resgate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rota em andamento *
                  </label>
                  <select
                    value={formData.resgateRotaId}
                    onChange={(e) => {
                      const rotaSelecionada = rotasEmAndamento.find((rota: any) => rota.id === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        resgateRotaId: e.target.value,
                        codigoRota: prev.codigoRota
                          ? prev.codigoRota
                          : rotaSelecionada?.codigoRota
                            ? `RESGATE - ${rotaSelecionada.codigoRota}`
                            : prev.codigoRota,
                      }));
                    }}
                    disabled={carregandoRotasEmAndamento}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">{carregandoRotasEmAndamento ? 'Carregando rotas...' : 'Selecione uma rota em andamento'}</option>
                    {rotasEmAndamento.map((rota: any) => (
                      <option key={rota.id} value={rota.id}>
                        {(rota.codigoRota || 'Sem código')} • {formatDatePtBr(rota.dataRota)} • {toHourMinute(rota.horaInicio)}
                      </option>
                    ))}
                  </select>
                  {!carregandoRotasEmAndamento && rotasEmAndamento.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Nenhuma rota em andamento disponível para resgate no momento.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código da oferta *
                  </label>
                  <input
                    type="text"
                    value={formData.codigoRota}
                    onChange={(e) => setFormData({ ...formData, codigoRota: e.target.value })}
                    placeholder="Ex.: RESGATE - ROTA 1234"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esse código será exibido ao motorista quando a oferta for enviada.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qtde. de Paradas *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qtdeParadas}
                    onChange={(e) => setFormData({ ...formData, qtdeParadas: e.target.value })}
                    placeholder="Ex.: 12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qtde. de Locais
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qtdeLocais}
                    onChange={(e) => setFormData({ ...formData, qtdeLocais: e.target.value })}
                    placeholder="Ex.: 8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qtde. de Pacotes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qtdePacotes}
                    onChange={(e) => setFormData({ ...formData, qtdePacotes: e.target.value })}
                    placeholder="Ex.: 75"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localização do motorista a ser resgatado *
                </label>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <ResgateLocationSelector
                    position={resgatePosition}
                    onSelect={(lat, lng) =>
                      setFormData((prev) => ({
                        ...prev,
                        latitudeOrigem: lat.toFixed(6),
                        longitudeOrigem: lng.toFixed(6),
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitudeOrigem}
                      onChange={(e) => setFormData({ ...formData, latitudeOrigem: e.target.value })}
                      placeholder="-23.550520"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitudeOrigem}
                      onChange={(e) => setFormData({ ...formData, longitudeOrigem: e.target.value })}
                      placeholder="-46.633308"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Clique no mapa para definir o ponto onde o motorista será resgatado ou ajuste as coordenadas manualmente.
                </p>
              </div>
            </div>
          )}

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
                  <option value="MOTOCICLETA">Motocicleta - {formatCurrency(getValorHora('MOTOCICLETA', false))}/h</option>
                  <option value="CARRO_PASSEIO">Carro - {formatCurrency(getValorHora('CARRO_PASSEIO', false))}/h</option>
                  <option value="CARGO_VAN">Cargo Van - {formatCurrency(getValorHora('CARGO_VAN', false))}/h</option>
                  <option value="LARGE_VAN">Large Van - {formatCurrency(getValorHora('LARGE_VAN', false))}/h</option>
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
                    Veículo da Transportadora ({formatCurrency(getValorHora(formData.tipoVeiculo, true))}/h)
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
              <div className="flex justify-between text-xs text-gray-500">
                <span>Tabela aplicada:</span>
                <span className="font-medium">
                  {valorCalculado.tabelaPrecosId
                    ? `${valorCalculado.tipoServicoAplicado || '—'} · ${valorCalculado.propriedadeAplicada || 'PROPRIO'}`
                    : carregandoTabelaPrecos
                      ? 'Carregando...'
                      : 'Não encontrada'}
                </span>
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
                <span>
                  + KM projetado ({formData.kmProjetado} km × {formatCurrency(valorCalculado.valorKmReferencia)})
                </span>
                <span className="font-medium">{formatCurrency(valorCalculado.bonusKmProjetado)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="font-semibold text-gray-900">Valor Total Projetado:</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(valorCalculado.valorTotalProjetado)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Valor final será calculado no D+1 com KM real rodado
              </p>
              {!carregandoTabelaPrecos && !valorCalculado.tabelaPrecosId && (
                <p className="text-xs text-red-600">
                  ⚠️ Não encontramos tabela de preços vigente para esta combinação na estação DBS5.
                  Ajuste o tipo de veículo/propriedade ou cadastre a tabela correspondente.
                </p>
              )}
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

// Modal de Criação de Rotas em Lote
interface RotaLoteLinhaData {
  id: string;
  dataRota: string;
  cicloRota: string;
  localId: string;
  tipoVeiculo: string;
  tamanhoHoras: string;
  horarios: string; // Formato: "10:00; 10:15; 10:30"
}

function RotasLoteModal({
  tabelaPrecos,
  carregandoTabelaPrecos,
  onClose,
}: {
  tabelaPrecos: TabelaPrecosProcessada | null;
  carregandoTabelaPrecos: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const findTabelaInfo = (tipoVeiculo: string, veiculoTransportadora: boolean) => {
    if (!tabelaPrecos) {
      return null;
    }

    const tiposServicoPossiveis = TIPO_VEICULO_TO_SERVICO[tipoVeiculo] || [];
    const propriedade = veiculoTransportadora ? 'TRANSPORTADORA' : 'PROPRIO';

    for (const tipoServico of tiposServicoPossiveis) {
      const info = tabelaPrecos.precos?.[tipoServico]?.[propriedade];
      if (info && info.valorHora > 0) {
        return {
          ...info,
          tipoServico,
          propriedade,
        };
      }
    }

    return null;
  };

  const getValorHora = (tipoVeiculo: string, veiculoTransportadora: boolean): number => {
    if (!tabelaPrecos) {
      if (veiculoTransportadora) return VALORES_PADRAO.TRANSPORTADORA;
      return VALORES_PADRAO[tipoVeiculo as keyof typeof VALORES_PADRAO] || 0;
    }

    const infoEncontrada = findTabelaInfo(tipoVeiculo, veiculoTransportadora);
    if (infoEncontrada) {
      return infoEncontrada.valorHora;
    }

    return VALORES_PADRAO[tipoVeiculo as keyof typeof VALORES_PADRAO] || 0;
  };

  const getValorKm = (): number => {
    return tabelaPrecos?.valorKm || VALORES_PADRAO.KM;
  };

  // Buscar locais
  const { data: locais = [] } = useQuery({
    queryKey: ['locais'],
    queryFn: async () => {
      const response = await api.get('/locais');
      const dados = response.data?.data?.locais || response.data?.locais || response.data;
      return Array.isArray(dados) ? dados : [];
    },
  });

  // Encontrar o local DBS5 como padrão
  const localDBS5 = useMemo(() => {
    return locais.find((local: any) => local.nome === 'DBS5');
  }, [locais]);

  const [linhas, setLinhas] = useState<RotaLoteLinhaData[]>([
    {
      id: crypto.randomUUID(),
      dataRota: toLocalDateInput(new Date()),
      cicloRota: 'CICLO_1',
      localId: '',
      tipoVeiculo: 'CARGO_VAN',
      tamanhoHoras: '8',
      horarios: '',
    },
    {
      id: crypto.randomUUID(),
      dataRota: toLocalDateInput(new Date()),
      cicloRota: 'CICLO_1',
      localId: '',
      tipoVeiculo: 'CARGO_VAN',
      tamanhoHoras: '8',
      horarios: '',
    },
    {
      id: crypto.randomUUID(),
      dataRota: toLocalDateInput(new Date()),
      cicloRota: 'CICLO_1',
      localId: '',
      tipoVeiculo: 'CARGO_VAN',
      tamanhoHoras: '8',
      horarios: '',
    },
    {
      id: crypto.randomUUID(),
      dataRota: toLocalDateInput(new Date()),
      cicloRota: 'CICLO_1',
      localId: '',
      tipoVeiculo: 'CARGO_VAN',
      tamanhoHoras: '8',
      horarios: '',
    },
  ]);

  // Atualizar localId quando DBS5 estiver disponível
  useEffect(() => {
    if (localDBS5 && linhas.length > 0 && !linhas[0].localId) {
      setLinhas(prev => prev.map(linha => ({ ...linha, localId: localDBS5.id })));
    }
  }, [localDBS5, linhas]);

  const adicionarLinha = () => {
    setLinhas(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        dataRota: toLocalDateInput(new Date()),
        cicloRota: 'CICLO_1',
        localId: localDBS5?.id || '',
        tipoVeiculo: 'CARGO_VAN',
        tamanhoHoras: '8',
        horarios: '',
      },
    ]);
  };

  const removerLinha = (id: string) => {
    setLinhas(prev => prev.filter(linha => linha.id !== id));
  };

  const atualizarLinha = (id: string, campo: keyof RotaLoteLinhaData, valor: string) => {
    setLinhas(prev =>
      prev.map(linha =>
        linha.id === id ? { ...linha, [campo]: valor } : linha
      )
    );
  };

  // Validar horários no formato HH:MM separados por ponto e vírgula
  const validarHorarios = (horarios: string): { valido: boolean; horariosArray: string[] } => {
    const horariosLimpos = horarios.trim();
    if (!horariosLimpos) {
      return { valido: false, horariosArray: [] };
    }

    const horariosArray = horariosLimpos
      .split(';')
      .map(h => h.trim())
      .filter(h => h);

    const regexHorario = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    const todosValidos = horariosArray.every(h => regexHorario.test(h));

    return { valido: todosValidos, horariosArray };
  };

  const saveMutation = useMutation({
    mutationFn: async (linhasParaSalvar: RotaLoteLinhaData[]) => {
      const rotasParaCriar: any[] = [];

      for (const linha of linhasParaSalvar) {
        const { valido, horariosArray } = validarHorarios(linha.horarios);

        if (!valido) {
          throw new Error(`Horários inválidos na linha da data ${formatDatePtBr(linha.dataRota)}`);
        }

        const quantidadeHorariosInformados = horariosArray.length;
        const tamanhoHoras = parseInt(linha.tamanhoHoras);

        if (isNaN(tamanhoHoras) || tamanhoHoras <= 0 || tamanhoHoras > 24) {
          throw new Error(`Quantidade de horas inválida na linha da data ${formatDatePtBr(linha.dataRota)}`);
        }

        if (quantidadeHorariosInformados === 0) {
          throw new Error(`Nenhum horário informado na linha da data ${formatDatePtBr(linha.dataRota)}`);
        }

        // Criar uma rota para cada horário informado
        for (const horario of horariosArray) {
          const infoTabela = findTabelaInfo(linha.tipoVeiculo, false);
          const valorHora = infoTabela?.valorHora ?? getValorHora(linha.tipoVeiculo, false);
          const valorKm = getValorKm();

          const valorBase = valorHora * tamanhoHoras;
          const valorProjetado = valorBase;
          const kmProjetado = 50; // valor padrão
          const bonusKmProjetado = kmProjetado * valorKm;
          const valorTotalProjetado = valorProjetado + bonusKmProjetado;

          const payload = {
            dataRota: new Date(linha.dataRota).toISOString(),
            horaInicio: `1970-01-01T${horario}:00Z`,
            horaFim: null,
            tipoVeiculo: linha.tipoVeiculo,
            tipoRota: 'ENTREGA',
            cicloRota: linha.cicloRota,
            tamanhoHoras: tamanhoHoras,
            veiculoTransportadora: false,
            valorHora: valorHora,
            bonusPorHora: 0,
            bonusFixo: 0,
            valorProjetado: valorProjetado,
            kmProjetado: kmProjetado,
            valorKm: valorKm,
            valorTotalRota: valorTotalProjetado,
            localId: linha.localId,
            latitudeOrigem: null,
            longitudeOrigem: null,
            qtdeParadas: null,
            qtdeLocais: null,
            qtdePacotes: null,
            codigoRota: null,
            resgateRotaId: null,
            tabelaPrecosId: infoTabela?.tabelaId ?? null,
            status: 'DISPONIVEL',
          };

          rotasParaCriar.push(payload);
        }
      }

      // Criar todas as rotas em paralelo
      const promises = rotasParaCriar.map(rota => api.post('/rotas', rota));
      await Promise.all(promises);

      return rotasParaCriar.length;
    },
    onSuccess: (totalCriadas) => {
      queryClient.invalidateQueries({ queryKey: ['rotas'] });
      alert(`${totalCriadas} rotas criadas com sucesso!`);
      onClose();
    },
    onError: (error: any) => {
      const mensagem = error.message || error.response?.data?.message || 'Erro ao salvar rotas em lote';
      alert(mensagem);
      console.error('Erro:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    for (const linha of linhas) {
      if (!linha.localId) {
        alert('Todas as linhas devem ter um local selecionado!');
        return;
      }

      if (!linha.dataRota) {
        alert('Todas as linhas devem ter uma data informada!');
        return;
      }

      const { valido, horariosArray } = validarHorarios(linha.horarios);
      if (!valido) {
        alert(`Horários inválidos na linha da data ${formatDatePtBr(linha.dataRota)}. Use o formato HH:MM separado por ponto e vírgula (ex: 10:00; 10:15; 10:30)`);
        return;
      }

      const tamanhoHoras = parseInt(linha.tamanhoHoras);
      const quantidadeHorariosInformados = horariosArray.length;

      if (isNaN(tamanhoHoras) || tamanhoHoras <= 0) {
        alert(`Quantidade de horas inválida na linha da data ${formatDatePtBr(linha.dataRota)}`);
        return;
      }

      if (quantidadeHorariosInformados === 0) {
        alert(`Informe pelo menos um horário na linha da data ${formatDatePtBr(linha.dataRota)}`);
        return;
      }

      const infoTabela = findTabelaInfo(linha.tipoVeiculo, false);
      if (!infoTabela) {
        alert(`Não encontramos tabela de preços para ${linha.tipoVeiculo}. Verifique a tabela de preços da estação DBS5.`);
        return;
      }
    }

    if (carregandoTabelaPrecos) {
      alert('Aguarde o carregamento da tabela de preços antes de salvar.');
      return;
    }

    // Confirmar criação
    const totalRotas = linhas.reduce((acc, linha) => {
      const { horariosArray } = validarHorarios(linha.horarios);
      return acc + horariosArray.length;
    }, 0);

    if (!window.confirm(`Você está prestes a criar ${totalRotas} rotas. Deseja continuar?`)) {
      return;
    }

    saveMutation.mutate(linhas);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-7xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Adicionar Rotas em Lote
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Preencha as informações para criar múltiplas rotas de uma vez
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Instruções</h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>O formulário inicia com 4 linhas vazias para preenchimento</li>
              <li>Preencha cada linha com as informações da rota</li>
              <li>No campo "Horários", digite todos os horários separados por ponto e vírgula (ex: 10:00; 10:15; 10:30)</li>
              <li>O sistema criará uma rota para cada horário informado</li>
              <li>Use o botão "+ Adicionar nova linha" para incluir mais linhas</li>
              <li>Use o botão "X" para remover uma linha indesejada</li>
            </ul>
          </div>

          <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                    Data da Rota
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                    Ciclo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                    Local
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                    Tipo de Serviço
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                    Horas
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase border">
                    Horários (HH:MM; HH:MM; ...)
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, index) => (
                  <tr key={linha.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 border">
                      <input
                        type="date"
                        required
                        value={linha.dataRota}
                        onChange={(e) => atualizarLinha(linha.id, 'dataRota', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-3 py-2 border">
                      <select
                        value={linha.cicloRota}
                        onChange={(e) => atualizarLinha(linha.id, 'cicloRota', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="CICLO_1">Ciclo 1</option>
                        <option value="CICLO_2">Ciclo 2</option>
                        <option value="SAME_DAY">Same Day</option>
                        <option value="SEM_CICLO">Sem Ciclo</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border">
                      <select
                        value={linha.localId}
                        onChange={(e) => atualizarLinha(linha.id, 'localId', e.target.value)}
                        required
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione</option>
                        {locais.map((local: any) => (
                          <option key={local.id} value={local.id}>
                            {local.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 border">
                      <select
                        value={linha.tipoVeiculo}
                        onChange={(e) => atualizarLinha(linha.id, 'tipoVeiculo', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="CARGO_VAN">CARGO_VAN</option>
                        <option value="LARGE_VAN">LARGE_VAN</option>
                        <option value="MOTOCICLETA">MOTOCICLETA</option>
                        <option value="CARRO_PASSEIO">CARRO_PASSEIO</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border">
                      <input
                        type="number"
                        required
                        min="1"
                        max="24"
                        value={linha.tamanhoHoras}
                        onChange={(e) => atualizarLinha(linha.id, 'tamanhoHoras', e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="8"
                      />
                    </td>
                    <td className="px-3 py-2 border">
                      <input
                        type="text"
                        required
                        value={linha.horarios}
                        onChange={(e) => atualizarLinha(linha.id, 'horarios', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10:00; 10:15; 10:30"
                      />
                      {linha.horarios && (() => {
                        const { valido, horariosArray } = validarHorarios(linha.horarios);
                        return (
                          <div className="text-xs mt-1">
                            {valido ? (
                              <span className="text-green-600">
                                ✓ {horariosArray.length} rota(s) serão criadas
                              </span>
                            ) : (
                              <span className="text-red-600">
                                ✗ Formato inválido
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 border text-center">
                      <button
                        type="button"
                        onClick={() => removerLinha(linha.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Remover linha"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={adicionarLinha}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar nova linha
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || carregandoTabelaPrecos}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Criando rotas...' : 'Criar Rotas'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
