import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  MapPin,
  Clock,
  Package,
  Truck,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import type { Rota, StatusTrackingMotorista } from '../../types';
import { TipoVeiculoLabels } from '../../types';

export default function RotasMonitoramento() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const STATUS_TRACKING_ORDER: Record<string, number> = {
    AGUARDANDO: 0,
    A_CAMINHO: 1,
    NO_LOCAL: 2,
    ROTA_INICIADA: 3,
    ROTA_CONCLUIDA: 4,
  };

  // Buscar rotas confirmadas do dia
  const { data: rotas = [], isLoading } = useQuery({
    queryKey: ['rotas-monitoramento', selectedDate],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          dataInicio: selectedDate,
          dataFim: selectedDate,
        });
        ['CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA'].forEach((status) => params.append('status', status));

        const response = await api.get(`/rotas?${params.toString()}`);
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        const resultado = Array.isArray(dados) ? dados : [];
        return resultado.filter((rota: any) =>
          ['CONFIRMADA', 'EM_ANDAMENTO', 'CONCLUIDA'].includes(rota.status)
        );
      } catch (error) {
        console.error('Erro ao buscar rotas:', error);
        return [];
      }
    },
  });

  const rotasOrdenadas = [...rotas].sort((a: any, b: any) => {
    const ordemA = STATUS_TRACKING_ORDER[a.statusTracking || 'AGUARDANDO'] ?? 0;
    const ordemB = STATUS_TRACKING_ORDER[b.statusTracking || 'AGUARDANDO'] ?? 0;
    if (ordemA !== ordemB) return ordemA - ordemB;

    const horaInicioA = new Date(a.horaInicio).getTime();
    const horaInicioB = new Date(b.horaInicio).getTime();
    if (!Number.isNaN(horaInicioA) && !Number.isNaN(horaInicioB)) {
      return horaInicioA - horaInicioB;
    }

    return 0;
  });

  const abrirWhatsApp = (telefone: string) => {
    // Remove caracteres não numéricos
    const telefoneNumerico = telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${telefoneNumerico}`;
    window.open(url, '_blank');
  };

  const getStatusClasse = (status?: StatusTrackingMotorista) => {
    switch (status) {
      case 'A_CAMINHO':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'NO_LOCAL':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ROTA_INICIADA':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ROTA_CONCLUIDA':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderFluxoStatus = (rota: Rota) => {
    const statusAtual = rota.statusTracking || 'AGUARDANDO';

    const etapas = [
      { id: 'AGUARDANDO', label: 'Aguardando', icon: Clock },
      { id: 'A_CAMINHO', label: 'À caminho', icon: Truck },
      { id: 'NO_LOCAL', label: 'No local', icon: MapPin },
      { id: 'ROTA_INICIADA', label: 'Em andamento', icon: Package },
      { id: 'ROTA_CONCLUIDA', label: 'Concluída', icon: CheckCircle },
    ];

    const indexAtual = etapas.findIndex((e) => e.id === statusAtual);

    return (
      <div className="flex items-center justify-between gap-1 mt-3">
        {etapas.map((etapa, index) => {
          const Icon = etapa.icon;
          const isAtual = etapa.id === statusAtual;
          const isConcluido = index < indexAtual;
          const isFuturo = index > indexAtual;

          return (
            <div key={etapa.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isConcluido ? 'bg-green-100 border-green-500' : ''}
                    ${isAtual ? 'bg-blue-100 border-blue-500 ring-4 ring-blue-200' : ''}
                    ${isFuturo ? 'bg-gray-100 border-gray-300' : ''}
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5
                      ${isConcluido ? 'text-green-600' : ''}
                      ${isAtual ? 'text-blue-600' : ''}
                      ${isFuturo ? 'text-gray-400' : ''}
                    `}
                  />
                </div>
                <p
                  className={`
                    text-xs mt-1 font-medium text-center
                    ${isConcluido ? 'text-green-700' : ''}
                    ${isAtual ? 'text-blue-700 font-bold' : ''}
                    ${isFuturo ? 'text-gray-500' : ''}
                  `}
                >
                  {etapa.label}
                </p>
              </div>
              {index < etapas.length - 1 && (
                <ArrowRight
                  className={`
                    w-4 h-4 mx-1
                    ${index < indexAtual ? 'text-green-500' : 'text-gray-300'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-7 h-7 text-blue-600" />
            Monitoramento de Rotas
          </h1>
          <p className="text-gray-600 mt-1">
            Acompanhe o status das rotas confirmadas, em andamento e concluídas em tempo real
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Rotas</p>
              <p className="text-2xl font-bold text-blue-900">{rotas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">À Caminho</p>
              <p className="text-2xl font-bold text-orange-900">
                {rotas.filter((r: Rota) => r.statusTracking === 'A_CAMINHO').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-purple-900">
                {rotas.filter((r: Rota) => r.statusTracking === 'ROTA_INICIADA').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-green-900">
                {rotas.filter((r: Rota) => r.statusTracking === 'ROTA_CONCLUIDA').length}
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
        ) : rotas.length === 0 ? (
          <div className="p-8 text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma rota confirmada encontrada para esta data</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rotasOrdenadas.map((rota: Rota) => (
              <div key={rota.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* Cabeçalho */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {rota.codigoRota || 'Sem código'}
                      </h3>
                      {rota.tipoRota === 'RESGATE' && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          RESGATE
                        </span>
                      )}
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusClasse(rota.statusTracking)}`}>
                        {rota.statusTracking === 'A_CAMINHO' && 'À CAMINHO'}
                        {rota.statusTracking === 'NO_LOCAL' && 'NO LOCAL'}
                        {rota.statusTracking === 'ROTA_INICIADA' && 'EM ANDAMENTO'}
                        {rota.statusTracking === 'ROTA_CONCLUIDA' && 'CONCLUÍDA'}
                        {!rota.statusTracking && 'AGUARDANDO'}
                      </span>
                    </div>

                    {/* Informações do Motorista */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Motorista</p>
                        <p className="font-medium text-gray-900">
                          {rota.motorista?.nome || 'Sem motorista'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tipo de veículo</p>
                        <p className="font-medium text-gray-900">
                          {rota.motorista?.tipoVeiculo
                            ? TipoVeiculoLabels[rota.motorista.tipoVeiculo]
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quantidade de paradas</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Package className="w-4 h-4 text-gray-600" />
                          {rota.qtdeParadas || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tamanho da rota</p>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-600" />
                          {rota.horasEstimadas}h
                        </p>
                      </div>
                    </div>

                    {/* Fluxo de Status */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Status do Motorista</p>
                      {renderFluxoStatus(rota)}
                    </div>
                  </div>

                  {/* Botão WhatsApp */}
                  <div className="ml-4">
                    <button
                      onClick={() => abrirWhatsApp(rota.motorista?.telefone || '')}
                      disabled={!rota.motorista?.telefone}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
