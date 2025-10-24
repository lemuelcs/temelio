import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Navigation,
  AlertTriangle,
  DollarSign,
  Package,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Rota, OfertaRota } from '../../types';

export default function RotasMotorista() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar rotas oferecidas para o motorista (status OFERTADA)
  const { data: rotasOferecidas = [], isLoading: loadingOfertas } = useQuery({
    queryKey: ['rotas-oferecidas', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/ofertas-rotas', {
          params: {
            motoristaId: user?.id,
            status: 'PENDENTE',
          },
        });
        const dados = response.data?.data?.ofertas || response.data?.ofertas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas oferecidas:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Buscar rotas confirmadas do motorista (status ACEITA ou EM_ANDAMENTO)
  const { data: rotasConfirmadas = [], isLoading: loadingConfirmadas } = useQuery({
    queryKey: ['rotas-confirmadas', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/rotas', {
          params: {
            motoristaId: user?.id,
            status: ['ACEITA', 'EM_ANDAMENTO'],
          },
        });
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas confirmadas:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Mutation para aceitar oferta
  const aceitarOfertaMutation = useMutation({
    mutationFn: async (ofertaId: string) => {
      return api.patch(`/ofertas-rotas/${ofertaId}/aceitar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-oferecidas'] });
      queryClient.invalidateQueries({ queryKey: ['rotas-confirmadas'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao aceitar oferta');
    },
  });

  // Mutation para recusar oferta
  const recusarOfertaMutation = useMutation({
    mutationFn: async ({ ofertaId, motivo }: { ofertaId: string; motivo: string }) => {
      return api.patch(`/ofertas-rotas/${ofertaId}/recusar`, { motivoRecusa: motivo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-oferecidas'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao recusar oferta');
    },
  });

  // Mutation para atualizar status de tracking
  const atualizarTrackingMutation = useMutation({
    mutationFn: async ({ rotaId, status }: { rotaId: string; status: string }) => {
      return api.patch(`/rotas/${rotaId}/tracking`, { statusTracking: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-confirmadas'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao atualizar status');
    },
  });

  const handleAceitar = (ofertaId: string) => {
    if (confirm('Deseja aceitar esta rota?')) {
      aceitarOfertaMutation.mutate(ofertaId);
    }
  };

  const handleRecusar = (ofertaId: string) => {
    const motivo = prompt('Por que você está recusando esta rota? (opcional)');
    recusarOfertaMutation.mutate({ ofertaId, motivo: motivo || 'Não informado' });
  };

  const handleACaminho = (rotaId: string) => {
    if (confirm('Confirma que você está à caminho do local?')) {
      atualizarTrackingMutation.mutate({ rotaId, status: 'A_CAMINHO' });
    }
  };

  const handleChegueiNoLocal = (rotaId: string) => {
    if (confirm('Confirma que você chegou no local para carregar?')) {
      atualizarTrackingMutation.mutate({ rotaId, status: 'NO_LOCAL' });
    }
  };

  const handleAbrirNavegacao = (rota: Rota) => {
    if (rota.localOrigem?.latitude && rota.localOrigem?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${rota.localOrigem.latitude},${rota.localOrigem.longitude}`;
      window.open(url, '_blank');
    } else if (rota.localOrigem?.endereco) {
      const enderecoEncoded = encodeURIComponent(
        `${rota.localOrigem.endereco}, ${rota.localOrigem.cidade} - ${rota.localOrigem.estado}`
      );
      const url = `https://www.google.com/maps/dir/?api=1&destination=${enderecoEncoded}`;
      window.open(url, '_blank');
    } else {
      alert('Coordenadas do local não disponíveis');
    }
  };

  const getDiaDaRota = (dataRota: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const dataRotaDate = new Date(dataRota);
    dataRotaDate.setHours(0, 0, 0, 0);

    if (dataRotaDate.getTime() === hoje.getTime()) {
      return { texto: 'HOJE', classe: 'bg-red-100 text-red-800' };
    } else if (dataRotaDate.getTime() === amanha.getTime()) {
      return { texto: 'AMANHÃ', classe: 'bg-orange-100 text-orange-800' };
    } else {
      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return { texto: diasSemana[dataRotaDate.getDay()], classe: 'bg-blue-100 text-blue-800' };
    }
  };

  const calcularHorarioColeta = (horaInicio: string) => {
    if (!horaInicio) return '';
    const [hora, minuto] = horaInicio.split(':').map(Number);
    const totalMinutos = hora * 60 + minuto - 45;
    const novaHora = Math.floor(totalMinutos / 60);
    const novoMinuto = totalMinutos % 60;
    return `${String(novaHora).padStart(2, '0')}:${String(novoMinuto).padStart(2, '0')}`;
  };

  const calcularValorEstimado = (rota: Rota) => {
    return (rota.horasEstimadas * rota.valorHora).toFixed(2);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🚚 Minhas Rotas</h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas rotas oferecidas e confirmadas
        </p>
      </div>

      {/* Rotas Oferecidas (D-1) */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Rotas Oferecidas (D-1)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Aceite ou recuse as rotas oferecidas para você
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {loadingOfertas ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : rotasOferecidas.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma rota oferecida no momento</p>
            </div>
          ) : (
            rotasOferecidas.map((oferta: OfertaRota) => {
              const rota = oferta.rota!;
              const dia = getDiaDaRota(rota.dataRota);
              const horarioColeta = calcularHorarioColeta(rota.horaInicio || '');
              const valorEstimado = calcularValorEstimado(rota);

              return (
                <div key={oferta.id} className="p-4 hover:bg-gray-50">
                  {/* Dia da Rota em Destaque */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-4 py-2 rounded-lg font-bold text-lg ${dia.classe}`}>
                      {dia.texto}
                    </span>
                    {rota.tipoRota === 'RESGATE' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        RESGATE
                      </span>
                    )}
                  </div>

                  {/* Informações da Rota */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Horário para coletar</p>
                      <p className="font-bold text-green-700 text-lg flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {horarioColeta}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Horário de início</p>
                      <p className="font-semibold text-gray-900 text-lg flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {rota.horaInicio?.substring(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tamanho da rota</p>
                      <p className="font-semibold text-gray-900">{rota.horasEstimadas}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Local de origem</p>
                      <p className="font-semibold text-gray-900">{rota.localOrigem?.nome}</p>
                    </div>
                  </div>

                  {/* Valor Estimado em Destaque */}
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Projeção de valor</p>
                    <p className="text-2xl font-bold text-green-700 flex items-center gap-2">
                      <DollarSign className="w-6 h-6" />
                      R$ {valorEstimado}
                    </p>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAceitar(oferta.id)}
                      disabled={aceitarOfertaMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Aceitar Rota
                    </button>
                    <button
                      onClick={() => handleRecusar(oferta.id)}
                      disabled={recusarOfertaMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      Recusar Rota
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rotas Confirmadas (D+0) */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            Rotas Confirmadas (D+0)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Suas rotas confirmadas pela Amazon
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {loadingConfirmadas ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : rotasConfirmadas.length === 0 ? (
            <div className="p-8 text-center">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma rota confirmada</p>
            </div>
          ) : (
            rotasConfirmadas.map((rota: Rota) => {
              const dia = getDiaDaRota(rota.dataRota);
              const horarioColeta = calcularHorarioColeta(rota.horaInicio || '');
              const valorEstimado = calcularValorEstimado(rota);
              const isExpanded = expandedId === rota.id;

              return (
                <div key={rota.id} className="p-4">
                  {/* Header Colapsável */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : rota.id)}
                    className="cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-4 py-2 rounded-lg font-bold text-lg ${dia.classe}`}>
                        {dia.texto}
                      </span>
                      <div className="flex items-center gap-2">
                        {rota.tipoRota === 'RESGATE' && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            RESGATE
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Horário para coletar</p>
                        <p className="font-bold text-green-700 text-lg flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {horarioColeta}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Horário de início</p>
                        <p className="font-semibold text-gray-900 text-lg flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {rota.horaInicio?.substring(0, 5)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Projeção de valor</p>
                      <p className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        R$ {valorEstimado}
                      </p>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Informações Detalhadas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Código da rota</p>
                          <p className="font-semibold text-gray-900">{rota.codigoRota || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Quantidade de paradas</p>
                          <p className="font-semibold text-gray-900">{rota.qtdeParadas || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Locais</p>
                          <p className="font-semibold text-gray-900">{rota.qtdeLocais || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pacotes</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {rota.qtdePacotes || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Local de Origem */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Local de origem</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          {rota.localOrigem?.nome}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {rota.localOrigem?.endereco}, {rota.localOrigem?.cidade} - {rota.localOrigem?.estado}
                        </p>
                      </div>

                      {/* Botão de Navegação */}
                      <button
                        onClick={() => handleAbrirNavegacao(rota)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Navigation className="w-5 h-5" />
                        Abrir Navegação até o Local
                      </button>

                      {/* Botões de Tracking */}
                      <div className="grid grid-cols-2 gap-2">
                        {(!rota.statusTracking || rota.statusTracking === 'AGUARDANDO') && (
                          <button
                            onClick={() => handleACaminho(rota.id)}
                            disabled={atualizarTrackingMutation.isPending}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                          >
                            <Truck className="w-5 h-5" />
                            À caminho do local
                          </button>
                        )}
                        {rota.statusTracking === 'A_CAMINHO' && (
                          <button
                            onClick={() => handleChegueiNoLocal(rota.id)}
                            disabled={atualizarTrackingMutation.isPending}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Cheguei no local
                          </button>
                        )}
                        {rota.statusTracking === 'NO_LOCAL' && (
                          <div className="col-span-2 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                            <p className="font-semibold text-green-800">✓ Você está no local para carregar</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
