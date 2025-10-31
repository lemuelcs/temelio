import { useState, useEffect, FormEvent } from 'react';
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
import type { Rota, OfertaRota, StatusTrackingMotorista } from '../../types';
import { StatusTrackingMotoristaLabels, StatusRotaLabels } from '../../types';

export default function RotasMotorista() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rotaParaConclusao, setRotaParaConclusao] = useState<Rota | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const obterPosicaoAtual = () =>
    new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

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

  // Buscar rotas relacionadas ao motorista (ACEITA, CONFIRMADA, EM_ANDAMENTO ou CONCLUIDA)
  const { data: rotasAceitasOuConfirmadas = [], isLoading: loadingRotasMotorista } = useQuery({
    queryKey: ['rotas-motorista', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/rotas', {
          params: {
            motoristaId: user?.id,
            status: ['ACEITA', 'CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA'],
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

  const rotasAgendadas = rotasAceitasOuConfirmadas.filter((rota: Rota) => rota.status === 'ACEITA');
  const rotasConfirmadas = rotasAceitasOuConfirmadas.filter((rota: Rota) =>
    ['CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA'].includes(rota.status)
  );

  // Mutation para aceitar oferta
  const aceitarOfertaMutation = useMutation({
    mutationFn: async (ofertaId: string) => {
      return api.patch(`/ofertas-rotas/${ofertaId}/aceitar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-oferecidas'] });
      queryClient.invalidateQueries({ queryKey: ['rotas-motorista'] });
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
    mutationFn: async ({ rotaId, status, payload }: { rotaId: string; status: string; payload?: Record<string, any> }) => {
      return api.patch(`/rotas/${rotaId}/tracking`, {
        statusTracking: status,
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-motorista'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Erro ao atualizar status');
    },
  });

  const enviarAtualizacaoTracking = async (
    rotaId: string,
    status: StatusTrackingMotorista,
    extraPayload: Record<string, any> = {},
    callbacks?: { onSuccess?: () => void }
  ) => {
    const posicaoAtual = await obterPosicaoAtual();
    if (!posicaoAtual) {
      alert('Não foi possível capturar sua localização. Verifique se o GPS está habilitado.');
    }

    const payload: Record<string, any> = {
      dispositivo: navigator.userAgent,
      ...extraPayload,
    };

    if (posicaoAtual) {
      payload.latitude = posicaoAtual.latitude;
      payload.longitude = posicaoAtual.longitude;
    }

    atualizarTrackingMutation.mutate(
      { rotaId, status, payload },
      {
        onSuccess: () => {
          if (callbacks?.onSuccess) callbacks.onSuccess();
        },
      }
    );
  };

  const handleAceitar = (ofertaId: string) => {
    if (confirm('Deseja aceitar esta rota?')) {
      aceitarOfertaMutation.mutate(ofertaId);
    }
  };

  const handleRecusar = (ofertaId: string) => {
    const motivo = prompt('Por que você está recusando esta rota? (opcional)');
    recusarOfertaMutation.mutate({ ofertaId, motivo: motivo || 'Não informado' });
  };

  const handleACaminho = (rota: Rota) => {
    if (confirm('Confirma que você está à caminho do local de carregamento?')) {
      enviarAtualizacaoTracking(rota.id, 'A_CAMINHO');
    }
  };

  const handleChegueiNoLocal = (rota: Rota) => {
    if (confirm('Confirma que você chegou no local para carregar?')) {
      enviarAtualizacaoTracking(rota.id, 'NO_LOCAL');
    }
  };

  const handleRotaCarregada = (rota: Rota) => {
    if (confirm('Confirma que a rota foi carregada e está pronta para iniciar?')) {
      enviarAtualizacaoTracking(rota.id, 'ROTA_INICIADA');
    }
  };

  const handleAbrirNavegacao = (rota: Rota) => {
    const origem: any = (rota as any).localOrigem || (rota as any).local;

    if (origem?.latitude && origem?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${origem.latitude},${origem.longitude}`;
      window.open(url, '_blank');
    } else if (origem?.endereco) {
      const enderecoEncoded = encodeURIComponent(
        `${origem.endereco}, ${origem.cidade || ''} - ${origem.estado || ''}`
      );
      const url = `https://www.google.com/maps/dir/?api=1&destination=${enderecoEncoded}`;
      window.open(url, '_blank');
    } else {
      alert('Coordenadas do local não disponíveis');
    }
  };

  const normalizarDataUtcParaLocal = (valor: string) => {
    const parsed = new Date(valor);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  };

  const getDiaDaRota = (dataRota: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const dataReferencia = normalizarDataUtcParaLocal(dataRota);
    const dataComparacao = dataReferencia ? new Date(dataReferencia) : null;
    if (dataComparacao) {
      dataComparacao.setHours(0, 0, 0, 0);
    }

    const dataCompleta = dataReferencia
      ? dataReferencia.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '';

    if (dataComparacao && dataComparacao.getTime() === hoje.getTime()) {
      return { texto: 'HOJE', classe: 'bg-red-100 text-red-800', dataCompleta };
    }

    if (dataComparacao && dataComparacao.getTime() === amanha.getTime()) {
      return { texto: 'AMANHÃ', classe: 'bg-orange-100 text-orange-800', dataCompleta };
    }

    if (dataComparacao) {
      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      return { texto: diasSemana[dataComparacao.getDay()], classe: 'bg-blue-100 text-blue-800', dataCompleta };
    }

    return { texto: 'Data indisponível', classe: 'bg-gray-100 text-gray-800', dataCompleta };
  };

  const calcularHorarioColeta = (horaInicio?: string | null) => {
    if (!horaInicio) return '';

    const formatoHorarioSimples = /^(\d{2}):(\d{2})/;
    let minutosTotal = 0;

    const correspondenciaSimples = formatoHorarioSimples.exec(horaInicio);
    if (correspondenciaSimples) {
      const hora = Number(correspondenciaSimples[1]);
      const minuto = Number(correspondenciaSimples[2]);
      minutosTotal = hora * 60 + minuto;
    } else {
      const parsed = new Date(horaInicio);
      if (!Number.isNaN(parsed.getTime())) {
        minutosTotal = parsed.getUTCHours() * 60 + parsed.getUTCMinutes();
      }
    }

    if (minutosTotal === 0) return '';

    // Subtrair 45 minutos
    minutosTotal -= 45;
    if (minutosTotal < 0) minutosTotal += 24 * 60; // Ajuste para dia anterior

    const horaColeta = Math.floor(minutosTotal / 60);
    const minutoColeta = minutosTotal % 60;

    return `${String(horaColeta).padStart(2, '0')}:${String(minutoColeta).padStart(2, '0')}`;
  };

  const formatHoraRota = (valor?: string | null) => {
    if (!valor) return '';
    const parsed = new Date(valor);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(11, 16);
    }

    if (typeof valor === 'string' && valor.includes(':')) {
      return valor.substring(0, 5);
    }

    return '';
  };

  const calcularValorEstimado = (rota: Rota) => {
    if (rota.valorProjetado !== undefined && rota.valorProjetado !== null) {
      return Number(rota.valorProjetado).toFixed(2);
    }

    const valorHora = rota.valorHora ?? 0;
    const horas = rota.tamanhoHoras ?? rota.horasEstimadas ?? 0;
    return Number(valorHora * horas).toFixed(2);
  };

  const obterDuracaoHoras = (rota: Rota) => rota.tamanhoHoras ?? rota.horasEstimadas ?? 0;

  const trackingBadgeClasses: Record<StatusTrackingMotorista, string> = {
    AGUARDANDO: 'bg-gray-100 text-gray-700 border border-gray-200',
    A_CAMINHO: 'bg-orange-100 text-orange-800 border border-orange-200',
    NO_LOCAL: 'bg-blue-100 text-blue-800 border border-blue-200',
    ROTA_INICIADA: 'bg-purple-100 text-purple-800 border border-purple-200',
    ROTA_CONCLUIDA: 'bg-green-100 text-green-800 border border-green-200',
  };

  return (
    <>
      <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🚚 Minhas Rotas</h1>
      </div>

      {/* Rotas Ofertadas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Rotas Ofertadas
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
              const horarioColeta = calcularHorarioColeta(rota.horaInicio);
              const valorEstimado = calcularValorEstimado(rota);
              const tituloRota = rota.descricao || rota.codigoRota || 'Rota sem nome';
              const origem: any = (rota as any).localOrigem || (rota as any).local;
              const nomeOrigem = origem?.nome || 'Local não informado';
              const enderecoOrigem = origem
                ? `${origem.endereco || ''}${origem.cidade ? `, ${origem.cidade}` : ''}${
                    origem.estado ? ` - ${origem.estado}` : ''
                  }`
                : '';

              return (
                <div key={oferta.id} className="p-4 hover:bg-gray-50">
                  {/* Dia da Rota em Destaque */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-4 py-2 rounded-lg ${dia.classe}`}>
                      <span className="block text-lg font-bold">{dia.texto}</span>
                      {dia.dataCompleta && (
                        <span className="block text-xs font-medium opacity-80">{dia.dataCompleta}</span>
                      )}
                    </div>
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
                        {formatHoraRota(rota.horaInicio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tamanho da rota</p>
                      <p className="font-semibold text-gray-900">{obterDuracaoHoras(rota)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Local de origem</p>
                      <p className="font-semibold text-gray-900">{nomeOrigem}</p>
                      {enderecoOrigem && (
                        <p className="text-xs text-gray-500">{enderecoOrigem}</p>
                      )}
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

      {/* Rotas Agendadas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Rotas Agendadas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Rotas aceitas aguardando confirmação da Amazon
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {loadingRotasMotorista ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : rotasAgendadas.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma rota agendada no momento</p>
            </div>
          ) : (
            rotasAgendadas.map((rota: Rota) => {
              const dia = getDiaDaRota(rota.dataRota);
              const horarioColeta = calcularHorarioColeta(rota.horaInicio);
              const valorEstimado = calcularValorEstimado(rota);
              const localOrigem: any = (rota as any).localOrigem || (rota as any).local;
              const nomeLocalOrigem = localOrigem?.nome || 'Local não informado';
              const enderecoLocalOrigem = localOrigem
                ? `${localOrigem.endereco || ''}${localOrigem.cidade ? `, ${localOrigem.cidade}` : ''}${
                    localOrigem.estado ? ` - ${localOrigem.estado}` : ''
                  }`
                : 'Endereço não informado';
              const tituloRota = rota.descricao || rota.codigoRota || 'Rota sem nome';

              return (
                <div key={rota.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-4 py-2 rounded-lg ${dia.classe}`}>
                      <span className="block text-lg font-bold">{dia.texto}</span>
                      {dia.dataCompleta && (
                        <span className="block text-xs font-medium opacity-80">{dia.dataCompleta}</span>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      {StatusRotaLabels[rota.status] || 'Agendada'}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-900">{tituloRota}</p>
                    <p className="text-xs text-gray-500">Paradas: {rota.qtdeParadas ?? 'N/A'}</p>
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
                        {formatHoraRota(rota.horaInicio)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tamanho da rota</p>
                      <p className="font-semibold text-gray-900">{obterDuracaoHoras(rota)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Local de origem</p>
                      <p className="font-semibold text-gray-900">{nomeLocalOrigem}</p>
                      {enderecoLocalOrigem && (
                        <p className="text-xs text-gray-500">{enderecoLocalOrigem}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Projeção de valor</p>
                      <p className="text-2xl font-bold text-green-700 flex items-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        R$ {valorEstimado}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Status da rota</p>
                      <p className="font-semibold text-gray-900">{StatusRotaLabels[rota.status] || rota.status}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rotas Confirmadas */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            Rotas Confirmadas
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Suas rotas confirmadas pela Amazon
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {loadingRotasMotorista ? (
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
              const horarioColeta = calcularHorarioColeta(rota.horaInicio);
              const valorEstimado = calcularValorEstimado(rota);
              const tituloRota = rota.descricao || rota.codigoRota || 'Rota sem nome';
              const isExpanded = expandedId === rota.id;
              const statusTracking = (rota.statusTracking as StatusTrackingMotorista) || 'AGUARDANDO';
              const podeIr = statusTracking === 'AGUARDANDO';
              const podeChegar = statusTracking === 'A_CAMINHO';
              const podeCarregar = statusTracking === 'NO_LOCAL';
              const podeConcluir = statusTracking === 'ROTA_INICIADA';
              const rotaConcluida = statusTracking === 'ROTA_CONCLUIDA';
              const localOrigem: any = (rota as any).localOrigem || (rota as any).local;
              const nomeLocalOrigem = localOrigem?.nome || 'Local não informado';
              const enderecoLocalOrigem = localOrigem
                ? `${localOrigem.endereco || ''}${localOrigem.cidade ? `, ${localOrigem.cidade}` : ''}${
                    localOrigem.estado ? ` - ${localOrigem.estado}` : ''
                  }`
                : 'Endereço não informado';
              const statusBadgeClass = trackingBadgeClasses[statusTracking];
              const statusTrackingLabel = StatusTrackingMotoristaLabels[statusTracking];

              return (
                <div key={rota.id} className="p-4">
                  {/* Header Colapsável */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : rota.id)}
                    className="cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`px-4 py-2 rounded-lg ${dia.classe}`}>
                        <span className="block text-lg font-bold">{dia.texto}</span>
                        {dia.dataCompleta && (
                          <span className="block text-xs font-medium opacity-80">{dia.dataCompleta}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusBadgeClass}`}>
                          {statusTrackingLabel}
                        </span>
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

                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-900">{tituloRota}</p>
                      <p className="text-xs text-gray-500">Paradas: {rota.qtdeParadas ?? 'N/A'}</p>
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
                          {formatHoraRota(rota.horaInicio)}
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
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                        <div>
                          <p className="text-xs text-gray-500">Status atual</p>
                          <p className="font-semibold text-gray-900">{statusTrackingLabel}</p>
                        </div>
                      </div>

                      {/* Local de Origem */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Local de origem</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          {nomeLocalOrigem}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {enderecoLocalOrigem}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {podeIr && (
                          <button
                            onClick={() => handleACaminho(rota)}
                            disabled={atualizarTrackingMutation.isPending}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                          >
                            <Truck className="w-5 h-5" />
                            Estou a caminho
                          </button>
                        )}
                        {podeChegar && (
                          <button
                            onClick={() => handleChegueiNoLocal(rota)}
                            disabled={atualizarTrackingMutation.isPending}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Cheguei no local
                          </button>
                        )}
                        {podeCarregar && (
                          <button
                            onClick={() => handleRotaCarregada(rota)}
                            disabled={atualizarTrackingMutation.isPending}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                          >
                            <Package className="w-5 h-5" />
                            Rota carregada
                          </button>
                        )}
                        {podeConcluir && (
                          <button
                            onClick={() => setRotaParaConclusao(rota)}
                            disabled={atualizarTrackingMutation.isPending}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Concluir rota
                          </button>
                        )}
                        {rotaConcluida && (
                          <div className="md:col-span-2 p-3 bg-green-100 border border-green-300 rounded-lg text-center text-green-800 font-semibold">
                            ✓ Rota concluída. Obrigado pelo seu trabalho!
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

      {rotaParaConclusao && (
        <ModalConclusaoRota
          rota={rotaParaConclusao}
          loading={atualizarTrackingMutation.isPending}
          onClose={() => setRotaParaConclusao(null)}
          onConfirm={({ insucessos, quantidadePNOV, satisfacao, feedback }) =>
            enviarAtualizacaoTracking(
              rotaParaConclusao.id,
              'ROTA_CONCLUIDA',
              {
                insucessos,
                quantidadePNOV,
                satisfacaoMotorista: satisfacao,
                feedbackMotorista: feedback,
              },
              {
                onSuccess: () => setRotaParaConclusao(null),
              }
            )
          }
        />
      )}
    </>
  );
}

function ModalConclusaoRota({
  rota,
  loading,
  onClose,
  onConfirm,
}: {
  rota: Rota;
  loading: boolean;
  onClose: () => void;
  onConfirm: (dados: {
    insucessos: number;
    quantidadePNOV: number;
    satisfacao: string;
    feedback: string;
  }) => void;
}) {
  const [insucessos, setInsucessos] = useState(0);
  const [quantidadePNOV, setQuantidadePNOV] = useState(0);
  const [satisfacao, setSatisfacao] = useState('SATISFEITO');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({
      insucessos,
      quantidadePNOV,
      satisfacao,
      feedback,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Concluir rota</h3>
            <p className="text-sm text-gray-500">Registre os resultados para finalizar a rota.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insucessos</label>
              <input
                type="number"
                min={0}
                value={insucessos}
                onChange={(e) => setInsucessos(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PNOV</label>
              <input
                type="number"
                min={0}
                value={quantidadePNOV}
                onChange={(e) => setQuantidadePNOV(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Como foi a rota?</label>
            <select
              value={satisfacao}
              onChange={(e) => setSatisfacao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MUITO_SATISFEITO">Muito satisfeito</option>
              <option value="SATISFEITO">Satisfeito</option>
              <option value="NEUTRO">Neutro</option>
              <option value="INSATISFEITO">Insatisfeito</option>
              <option value="MUITO_INSATISFEITO">Muito insatisfeito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback adicional</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Compartilhe como foi a rota, desafios ou comentários."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Registrar conclusão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
