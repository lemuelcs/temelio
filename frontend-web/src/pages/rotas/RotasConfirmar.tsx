import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Package, MapPin, Clock, AlertTriangle, Calendar, Truck } from 'lucide-react';
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
                  <RotaConfirmarInline
                    key={rota.id}
                    rota={rota}
                    isLast={index === rotasAceitas.length - 1 && rotasConfirmadas.length === 0 && rotasCanceladas.length === 0}
                    formatTime={formatTime}
                    getCicloLabel={getCicloLabel}
                    queryClient={queryClient}
                  />
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

    </div>
  );
}

// Componente de confirmação inline
function RotaConfirmarInline({
  rota,
  isLast,
  formatTime,
  getCicloLabel,
  queryClient
}: {
  rota: any;
  isLast: boolean;
  formatTime: (time: string) => string;
  getCicloLabel: (ciclo: string) => string;
  queryClient: any;
}) {
  const [formData, setFormData] = useState({
    codigoRota: rota.codigoRota || '',
    qtdePacotes: rota.qtdePacotes || '',
    qtdeLocais: rota.qtdeLocais || '',
    qtdeParadas: rota.qtdeParadas || '',
    horaInicio: formatTime(rota.horaInicio),
  });

  const confirmarMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        codigoRota: data.codigoRota,
        qtdePacotes: data.qtdePacotes ? parseInt(data.qtdePacotes) : undefined,
        qtdeLocais: data.qtdeLocais ? parseInt(data.qtdeLocais) : undefined,
        qtdeParadas: data.qtdeParadas ? parseInt(data.qtdeParadas) : undefined,
        horaInicioReal: data.horaInicio ? `1970-01-01T${data.horaInicio}:00Z` : null,
      };

      return api.patch(`/rotas/${rota.id}/confirmar`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-confirmar'] });
      queryClient.invalidateQueries({ queryKey: ['rotas'] });
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
    <form
      onSubmit={handleSubmit}
      className={`px-6 py-5 border-b border-gray-200 ${isLast ? 'border-b-0' : ''}`}
    >
      <div className="space-y-4">
        {/* Header com motorista e ciclo */}
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-gray-500 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-gray-900">
                {rota.motorista?.nomeCompleto || 'Sem motorista'}
              </h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                {getCicloLabel(rota.cicloRota)}
              </span>
            </div>
          </div>
        </div>

        {/* Informações básicas */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            Duração: {rota.tamanhoHoras}h
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-4 h-4 text-purple-600" />
            {rota.local?.cidade || 'Sem cidade'}
          </span>
        </div>

        {/* Campos de confirmação */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3 border-t border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Código da Rota *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: BSB-C1-001"
              value={formData.codigoRota}
              onChange={(e) => setFormData({ ...formData, codigoRota: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Pacotes
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.qtdePacotes}
              onChange={(e) => setFormData({ ...formData, qtdePacotes: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Locais
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.qtdeLocais}
              onChange={(e) => setFormData({ ...formData, qtdeLocais: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Paradas
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.qtdeParadas}
              onChange={(e) => setFormData({ ...formData, qtdeParadas: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hora Início
            </label>
            <input
              type="time"
              value={formData.horaInicio}
              onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Botão de confirmação */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={confirmarMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </form>
  );
}
