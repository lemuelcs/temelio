import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { AlertTriangle, Calendar, CheckCircle, FileText, RefreshCw, User, XCircle } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Severidade = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';

interface AlertRecord {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  severidade: Severidade;
  resolvido: boolean;
  createdAt: string;
  motorista?: {
    id: string;
    nomeCompleto: string;
    transporterId?: string | null;
    status?: string | null;
    celular?: string | null;
  } | null;
}

interface DashboardCompliance {
  totalMotoristas: number;
  motoristasComAlerta: number;
  motoristasCompliant: number;
  percentualCompliance: number;
  alertasAbertos: number;
  alertasPorSeveridade: Array<{ severidade: string; total: number }>;
  alertasPorTipo: Array<{ tipo: string; total: number }>;
}

interface MotoristaAlertas {
  motorista: {
    id: string;
    nome: string;
    transporterId?: string;
    status?: string;
    celular?: string;
  };
  alertas: AlertRecord[];
}

const severityStyles: Record<Severidade, string> = {
  CRITICA: 'bg-red-100 text-red-700 border border-red-200',
  ALTA: 'bg-orange-100 text-orange-700 border border-orange-200',
  MEDIA: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  BAIXA: 'bg-blue-100 text-blue-700 border border-blue-200',
};

const severityLabels: Record<Severidade, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

const tipoAlertasOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'CNH', label: 'CNH' },
  { value: 'BRK', label: 'BRK' },
  { value: 'CRLV', label: 'CRLV' },
  { value: 'VEICULO', label: 'Veículo' },
];

const tiposDocsVencendo = [
  'CNH_VENCENDO',
  'BRK_VENCENDO',
  'CRLV_ATENCAO',
  'CRLV_DESATUALIZADO',
  'BRK_NAO_APROVADO',
];

const getErrorMessage = (err: unknown): string => {
  if (!err) {
    return 'Erro desconhecido';
  }

  const axiosError = err as AxiosError<{ message?: string }>;
  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError?.message) {
    return axiosError.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Erro desconhecido';
};

export default function Alertas() {
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  const {
    data: dashboard,
    isLoading: loadingDashboard,
    error: dashboardError,
  } = useQuery<DashboardCompliance | undefined>({
    queryKey: ['alertas-dashboard'],
    queryFn: async () => {
      const response = await api.get('/alertas/dashboard/compliance');
      return response.data?.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: alertas = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AlertRecord[]>({
    queryKey: ['alertas-list'],
    queryFn: async () => {
      const response = await api.get('/alertas', { params: { resolvido: false } });
      const dados = response.data?.data?.alertas || response.data?.alertas || [];
      return Array.isArray(dados) ? dados : [];
    },
  });

  const loading = isLoading || loadingDashboard;
  const hasError = error || dashboardError;

  const stats = useMemo(() => {
    const totalMotoristas = dashboard?.totalMotoristas ?? 0;
    const motoristasComAlerta = dashboard?.motoristasComAlerta ?? new Set(
      alertas.map((alerta) => alerta.motorista?.id).filter(Boolean)
    ).size;
    const cnhVencida = alertas.filter((alerta) => alerta.tipo === 'CNH_VENCIDA').length;
    const docsVencendo = alertas.filter((alerta) => tiposDocsVencendo.includes(alerta.tipo)).length;

    return {
      totalMotoristas,
      motoristasComAlerta,
      cnhVencida,
      docsVencendo,
    };
  }, [dashboard, alertas]);

  const alertasPorMotorista = useMemo<MotoristaAlertas[]>(() => {
    const mapa = new Map<string, MotoristaAlertas>();

    alertas.forEach((alerta) => {
      const motoristaId = alerta.motorista?.id ?? `sem-motorista-${alerta.id}`;
      const existente = mapa.get(motoristaId) ?? {
        motorista: {
          id: motoristaId,
          nome: alerta.motorista?.nomeCompleto ?? 'Motorista não vinculado',
          transporterId: alerta.motorista?.transporterId ?? undefined,
          status: alerta.motorista?.status ?? undefined,
          celular: alerta.motorista?.celular ?? undefined,
        },
        alertas: [],
      };

      existente.alertas.push(alerta);
      mapa.set(motoristaId, existente);
    });

    return Array.from(mapa.values());
  }, [alertas]);

  const filteredMotoristas = useMemo(() => {
    return alertasPorMotorista.filter((grupo) => {
      const hasCritical = grupo.alertas.some((alerta) => alerta.severidade === 'CRITICA');
      const hasAttention = grupo.alertas.some((alerta) => alerta.severidade === 'ALTA' || alerta.severidade === 'MEDIA');

      const matchesSeverity =
        !filterSeverity ||
        (filterSeverity === 'CRITICO' && hasCritical) ||
        (filterSeverity === 'ATENCAO' && hasAttention);

      const matchesTipo =
        !filterTipo ||
        grupo.alertas.some((alerta) => alerta.tipo.startsWith(filterTipo));

      return matchesSeverity && matchesTipo;
    });
  }, [alertasPorMotorista, filterSeverity, filterTipo]);

  if (hasError) {
    const message = getErrorMessage(error ?? dashboardError);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas de Compliance</h1>
          <p className="text-gray-600 mt-1">Monitore documentos e alertas de cada motorista</p>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-lg mb-2">Erro ao carregar alertas</p>
              <p className="text-red-700 mb-4">{message}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas de Compliance</h1>
        <p className="text-gray-600 mt-1">Acompanhe pendências de documentos e elegibilidade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Motoristas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMotoristas}</p>
            </div>
            <User className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Motoristas com Alertas</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.motoristasComAlerta}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CNH Vencida</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.cnhVencida}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Docs Vencendo</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.docsVencendo}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as severidades</option>
            <option value="CRITICO">Críticos</option>
            <option value="ATENCAO">Requer atenção</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {tipoAlertasOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando alertas...</p>
        </div>
      ) : filteredMotoristas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum alerta encontrado com os filtros aplicados</p>
        </div>
      ) : (
        filteredMotoristas.map((grupo) => (
          <div
            key={grupo.motorista.id}
            className={`bg-white rounded-lg shadow p-6 space-y-4 ${
              grupo.alertas.some((alerta) => alerta.severidade === 'CRITICA')
                ? 'border-l-4 border-red-500'
                : 'border border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <User className="w-6 h-6 text-gray-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{grupo.motorista.nome}</h3>
                  {grupo.motorista.transporterId && (
                    <p className="text-sm text-gray-500">ID externo: {grupo.motorista.transporterId}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {grupo.motorista.status || 'Status desconhecido'}
                    {grupo.motorista.celular ? ` • ${grupo.motorista.celular}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {grupo.alertas.map((alerta) => (
                  <span
                    key={`${alerta.id}-chip`}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${severityStyles[alerta.severidade]}`}
                  >
                    {severityLabels[alerta.severidade]}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {grupo.alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{alerta.titulo}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityStyles[alerta.severidade]}`}>
                      {severityLabels[alerta.severidade]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{alerta.descricao}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(alerta.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>{alerta.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
