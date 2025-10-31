import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Package, MapPin, Clock, AlertTriangle, Calendar } from 'lucide-react';
import api from '../../services/api';

interface Rota {
  id: string;
  dataRota: string;
  horaInicio: string;
  tipoVeiculo: string;
  tipoRota: string;
  cicloRota: string;
  tamanhoHoras: number;
  local?: {
    nome: string;
    cidade: string;
  };
  motorista?: {
    id: string;
    nomeCompleto: string;
    celular: string;
  };
}

export default function RotasConfirmar() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Buscar rotas aceitas do dia
  const { data: rotas = [], isLoading } = useQuery({
    queryKey: ['rotas-confirmar', selectedDate],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          dataInicio: selectedDate,
          dataFim: selectedDate
        });
        ['ACEITA', 'CONFIRMADA', 'CANCELADA'].forEach((status) => params.append('status', status));

        const response = await api.get(`/rotas?${params.toString()}`);
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas:', error);
        return [];
      }
    },
  });

  const rotasAceitas = rotas.filter((rota: any) => rota.status === 'ACEITA');
  const rotasConfirmadas = rotas.filter((rota: any) => rota.status === 'CONFIRMADA');
  const rotasCanceladas = rotas.filter((rota: any) => rota.status === 'CANCELADA');
  const naoHaRotas =
    rotasAceitas.length === 0 && rotasConfirmadas.length === 0 && rotasCanceladas.length === 0;

  const getTipoVeiculoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      MOTOCICLETA: 'Moto',
      CARRO_PASSEIO: 'Carro',
      CARGO_VAN: 'Van Carga',
      LARGE_VAN: 'Van Grande',
    };
    return labels[tipo] || tipo;
  };

  const getCicloLabel = (ciclo: string) => {
    const labels: Record<string, string> = {
      CICLO_1: 'Ciclo 1',
      CICLO_2: 'Ciclo 2',
      SAME_DAY: 'Same Day',
      SEM_CICLO: 'Sem Ciclo',
    };
    return labels[ciclo] || ciclo;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const parsed = new Date(timeString);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(11, 16);
    }

    if (typeof timeString === 'string' && timeString.includes(':')) {
      return timeString.substring(0, 5);
    }

    return '';
  };

  const formatSelectedDate = (value: string) => {
    if (!value) return '';
    const partes = value.split('-').map(Number);
    if (partes.length !== 3 || partes.some((parte) => Number.isNaN(parte))) {
      return '';
    }
    const [ano, mes, dia] = partes;
    const data = new Date(ano, mes - 1, dia);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmar Rotas (D+0)</h1>
          <p className="text-gray-600 mt-1">
            Confirme as rotas com código e detalhes da roteirização
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aguardando Confirmação</p>
              <p className="text-2xl font-bold text-yellow-900">{rotasAceitas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rotas Confirmadas</p>
              <p className="text-2xl font-bold text-green-900">{rotasConfirmadas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rotas Canceladas</p>
              <p className="text-2xl font-bold text-red-900">{rotasCanceladas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Data Selecionada</p>
              <p className="text-lg font-bold text-blue-900">
                {formatSelectedDate(selectedDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Rotas */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando rotas...</p>
          </div>
        ) : naoHaRotas ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma rota para confirmar nesta data</p>
            <p className="text-sm text-gray-500 mt-2">
              Ajuste a data ou aguarde as rotas serem roteirizadas pela Amazon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {rotasAceitas.length > 0 && (
              <>
                <div className="px-6 py-3 bg-yellow-100 border-b border-yellow-200">
                  <h2 className="text-sm font-semibold text-yellow-800 uppercase tracking-wide">
                    Rotas aguardando confirmação
                  </h2>
                  <p className="text-xs text-yellow-700">
                    Valide os dados recebidos da Amazon e confirme a rota.
                  </p>
                </div>
                {rotasAceitas.map((rota: any, index: number) => (
                  <div
                    key={rota.id}
                    className={`px-6 py-5 border-b border-gray-200 ${
                      index === rotasAceitas.length - 1 && rotasConfirmadas.length === 0 && rotasCanceladas.length === 0
                        ? 'border-b-0'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {rota.motorista?.nomeCompleto || 'Sem motorista'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {rota.motorista?.celular || 'Sem telefone'}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {getCicloLabel(rota.cicloRota)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            {rota.local?.nome || 'N/A'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            {formatTime(rota.horaInicio)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Package className="w-4 h-4 text-green-600" />
                            {rota.tamanhoHoras}h
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            {rota.local?.cidade || 'Sem cidade'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmingId(rota.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Confirmar Rota
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {rotasConfirmadas.length > 0 && (
              <>
                <div className="px-6 py-3 bg-green-100 border-t border-b border-green-200">
                  <h2 className="text-sm font-semibold text-green-800 uppercase tracking-wide">
                    Rotas confirmadas
                  </h2>
                  <p className="text-xs text-green-700">
                    Dados recebidos da Amazon e prontos para acompanhamento.
                  </p>
                </div>
                {rotasConfirmadas.map((rota: any, index: number) => (
                  <div
                    key={rota.id}
                    className={`px-6 py-5 bg-green-50 border-b border-green-200 ${
                      index === rotasConfirmadas.length - 1 && rotasCanceladas.length === 0 ? 'border-b-0' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                          <div>
                            <h3 className="font-semibold text-lg text-green-900">
                              {rota.codigoRota || 'Sem código'}
                            </h3>
                            <p className="text-sm text-green-700">
                              Motorista: {rota.motorista?.nomeCompleto || 'Não informado'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-green-700 font-medium">Paradas</p>
                            <p className="text-green-900 font-semibold">{rota.qtdeParadas ?? '-'}</p>
                          </div>
                          <div>
                            <p className="text-green-700 font-medium">Locais</p>
                            <p className="text-green-900 font-semibold">{rota.qtdeLocais ?? '-'}</p>
                          </div>
                          <div>
                            <p className="text-green-700 font-medium">Pacotes</p>
                            <p className="text-green-900 font-semibold">{rota.qtdePacotes ?? '-'}</p>
                          </div>
                          <div>
                            <p className="text-green-700 font-medium">Início previsto</p>
                            <p className="text-green-900 font-semibold">
                              {formatTime(rota.horaInicio)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmingId(rota.id)}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition"
                      >
                        <Package className="w-5 h-5" />
                        Editar dados
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {rotasCanceladas.length > 0 && (
              <>
                <div className="px-6 py-3 bg-red-100 border-t border-b border-red-200">
                  <h2 className="text-sm font-semibold text-red-800 uppercase tracking-wide">
                    Rotas canceladas pela Amazon
                  </h2>
                  <p className="text-xs text-red-700">
                    Avalie o motivo e registre o valor de cancelamento se necessário.
                  </p>
                </div>
                {rotasCanceladas.map((rota: any, index: number) => (
                  <div
                    key={rota.id}
                    className={`px-6 py-5 bg-red-50 border-b border-red-200 ${
                      index === rotasCanceladas.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                          <div>
                            <h3 className="font-semibold text-lg text-red-800">
                              {rota.codigoRota || 'Rota cancelada'}
                            </h3>
                            <p className="text-sm text-red-700">
                              Motorista: {rota.motorista?.nomeCompleto || 'Não informado'}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-red-700">
                          Motivo: {rota.motivoCancelamento || 'Motivo não informado'}
                        </p>
                        {rota.valorCancelamento && (
                          <p className="text-sm text-red-800 font-semibold">
                            Valor de cancelamento: {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(rota.valorCancelamento))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {confirmingId && (
        <ConfirmarModal
          rotaId={confirmingId}
          onClose={() => setConfirmingId(null)}
        />
      )}
    </div>
  );
}

// Modal de Confirmação
function ConfirmarModal({ rotaId, onClose }: { rotaId: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    codigoRota: '',
    qtdePacotes: 0,
    qtdeLocais: 0,
    qtdeParadas: 0,
    horaInicioReal: '',
    horaFimReal: '',
  });

  const formatTimeInput = (value?: string | null) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const hours = String(parsed.getHours()).padStart(2, '0');
      const minutes = String(parsed.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    if (typeof value === 'string' && value.includes(':')) {
      return value.substring(0, 5);
    }

    return '';
  };

  // Buscar dados da rota
  const { data: rota, isFetching } = useQuery({
    queryKey: ['rota', rotaId],
    queryFn: async () => {
      const response = await api.get(`/rotas/${rotaId}`);
      return response.data?.data || response.data;
    },
  });

  useEffect(() => {
    if (!rota) return;

    setFormData({
      codigoRota: rota.codigoRota || '',
      qtdePacotes: rota.qtdePacotes ?? 0,
      qtdeLocais: rota.qtdeLocais ?? 0,
      qtdeParadas: rota.qtdeParadas ?? 0,
      horaInicioReal: formatTimeInput(rota.horaInicioReal),
      horaFimReal: formatTimeInput(rota.horaFimReal),
    });
  }, [rota]);

  const confirmarMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        codigoRota: data.codigoRota,
        qtdePacotes: parseInt(data.qtdePacotes),
        qtdeLocais: parseInt(data.qtdeLocais),
        qtdeParadas: parseInt(data.qtdeParadas),
        horaInicioReal: data.horaInicioReal ? `1970-01-01T${data.horaInicioReal}:00Z` : null,
        horaFimReal: data.horaFimReal ? `1970-01-01T${data.horaFimReal}:00Z` : null,
      };

      return api.patch(`/rotas/${rotaId}/confirmar`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-confirmar'] });
      queryClient.invalidateQueries({ queryKey: ['rotas'] });
      onClose();
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao confirmar rota';
      alert(mensagem);
      console.error('Erro:', error.response?.data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigoRota.trim()) {
      alert('Código da rota é obrigatório!');
      return;
    }

    confirmarMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Confirmar Rota - Roteirização D+0
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Motorista: {rota?.motorista?.nomeCompleto || 'N/A'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Código da Rota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código da Rota * <span className="text-red-500">(Gerado pela roteirização)</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: BSB-C1-001"
              value={formData.codigoRota}
              onChange={(e) => setFormData({ ...formData, codigoRota: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quantidades */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalhes da Roteirização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Pacotes *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.qtdePacotes}
                  onChange={(e) => setFormData({ ...formData, qtdePacotes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Locais *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.qtdeLocais}
                  onChange={(e) => setFormData({ ...formData, qtdeLocais: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Paradas *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.qtdeParadas}
                  onChange={(e) => setFormData({ ...formData, qtdeParadas: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Horários Reais (Opcional) */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ajuste de Horários (opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Início Real
                </label>
                <input
                  type="time"
                  value={formData.horaInicioReal}
                  onChange={(e) => setFormData({ ...formData, horaInicioReal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para manter horário original
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Fim Real
                </label>
                <input
                  type="time"
                  value={formData.horaFimReal}
                  onChange={(e) => setFormData({ ...formData, horaFimReal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Informações da Rota Original */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Informações da Oferta Original</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data:</p>
                <p className="font-medium">{new Date(rota?.dataRota || '').toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-gray-600">Hora prevista:</p>
                <p className="font-medium">{rota?.horaInicio?.substring(0, 5) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Duração:</p>
                <p className="font-medium">{rota?.tamanhoHoras || 0}h</p>
              </div>
              <div>
                <p className="text-gray-600">Ciclo:</p>
                <p className="font-medium">{rota?.cicloRota || 'N/A'}</p>
              </div>
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
              disabled={confirmarMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar Rota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
