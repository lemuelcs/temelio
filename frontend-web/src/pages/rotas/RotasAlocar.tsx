import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Calendar, Clock, MapPin, DollarSign, User, AlertCircle, CheckCircle, Edit2, Trash2 } from 'lucide-react';
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
  motorista?: {
    id: string;
    nomeCompleto: string;
    celular?: string;
    tipoVeiculo?: string;
    status?: string;
  } | null;
  ofertas?: Array<{
    id: string;
    status: string;
    motorista?: {
      id: string;
      nomeCompleto: string;
      celular?: string;
    } | null;
  }>;
}

interface Alocacao {
  rotaId: string;
  motoristaId: string;
}

const toLocalDateInput = (date: Date) => {
  const offsetInMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetInMs).toISOString().split('T')[0];
};

const addDaysToDateString = (dateStr: string, days: number) => {
  const base = new Date(`${dateStr}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toLocalDateInput(base);
};

const STATUS_ORDER: Record<string, number> = {
  DISPONIVEL: 0,
  RECUSADA: 1,
  OFERTADA: 2,
  ACEITA: 3,
};

const STATUS_BADGE_CONFIG: Record<
  string,
  {
    label: string;
    classes: string;
  }
> = {
  DISPONIVEL: {
    label: 'Disponível',
    classes: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  RECUSADA: {
    label: 'Recusada',
    classes: 'bg-red-100 text-red-800 border border-red-200',
  },
  OFERTADA: {
    label: 'Ofertada',
    classes: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  ACEITA: {
    label: 'Aceita',
    classes: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
};

const allowedStatuses = ['DISPONIVEL', 'RECUSADA', 'OFERTADA', 'ACEITA'];

const getStatusBadge = (status: string) =>
  STATUS_BADGE_CONFIG[status] || {
    label: status,
    classes: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

const formatDatePtBr = (value: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(parsed);
};

const normalizarCiclo = (valor: string | null | undefined) =>
  (valor || '').toString().replace(/_/g, '').toUpperCase();

const toHourMinute = (value?: string | null) => {
  if (!value) return '';

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(11, 16);
  }

  if (typeof value === 'string' && value.includes(':')) {
    return value.substring(0, 5);
  }

  return '';
};

const timeToMinutes = (value?: string | null) => {
  if (!value) return 0;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getUTCHours() * 60 + parsed.getUTCMinutes();
  }

  if (typeof value === 'string' && value.includes(':')) {
    const [hourStr, minuteStr] = value.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      return hour * 60 + minute;
    }
  }

  return 0;
};

const isSameDate = (dataA?: string, dataB?: string) => {
  if (!dataA || !dataB) return false;
  const dateA = new Date(dataA);
  const dateB = new Date(dataB);
  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) return false;
  return dateA.toDateString() === dateB.toDateString();
};

export default function RotasAlocacao() {
  const queryClient = useQueryClient();
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [filterData, setFilterData] = useState<string>('');
  const [editingRoutes, setEditingRoutes] = useState<Record<string, boolean>>({});
  const [editSelections, setEditSelections] = useState<Record<string, string>>({});
  const [rotaReofertaEmProgresso, setRotaReofertaEmProgresso] = useState<string | null>(null);
  const [rotaCancelamentoEmProgresso, setRotaCancelamentoEmProgresso] = useState<string | null>(null);

  // Definir filtro de data padrão (hoje e amanhã)
  useEffect(() => {
    const hoje = new Date();
    setFilterData(toLocalDateInput(hoje));
  }, []);


  // Buscar rotas disponíveis
  const { data: rotas = [], isLoading: loadingRotas } = useQuery({
    queryKey: ['rotas-disponiveis', filterData],
    queryFn: async () => {
      try {
        if (!filterData) return [];

        const dataInicio = filterData;
        const dataFim = addDaysToDateString(filterData, 1);

        const params = new URLSearchParams({
          dataInicio,
          dataFim,
        });
        allowedStatuses.forEach((status) => params.append('status', status));

        const response = await api.get(`/rotas?${params.toString()}`);
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        const resultado = (Array.isArray(dados) ? dados : []) as Rota[];
        const filtrado = resultado.filter((rota) => allowedStatuses.includes(rota.status));
        const ordenado = [...filtrado].sort((a, b) => {
          const statusDiff =
            (STATUS_ORDER[a.status] ?? Number.MAX_SAFE_INTEGER) -
            (STATUS_ORDER[b.status] ?? Number.MAX_SAFE_INTEGER);
          if (statusDiff !== 0) return statusDiff;

          const dataDiff =
            new Date(a.dataRota).getTime() - new Date(b.dataRota).getTime();
          if (dataDiff !== 0) return dataDiff;

          return timeToMinutes(a.horaInicio) - timeToMinutes(b.horaInicio);
        });
        return ordenado;
      } catch (_error) {
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
        const params = new URLSearchParams({ status: 'ATIVO', limit: '200' });
        const response = await api.get(`/gestao/motoristas?${params.toString()}`);
        const dados = response.data?.data?.motoristas || response.data?.motoristas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (_error) {
        return [];
      }
    },
  });

  // Buscar disponibilidades dos motoristas
  const { data: disponibilidades = [], isError: errorDisponibilidades, error: disponibilidadesError } = useQuery({
    queryKey: ['disponibilidades', filterData],
    queryFn: async () => {
      if (!filterData) return [];
      try {
        const dataInicio = filterData;
        const dataFim = addDaysToDateString(filterData, 1);

        const params = new URLSearchParams({
          dataInicio,
          dataFim,
        });

        const response = await api.get(`/gestao/disponibilidades/intervalo?${params.toString()}`);
        const dados = response.data?.data || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error: any) {
        throw error; // Propagar o erro para que o useQuery possa capturá-lo
      }
    },
    enabled: !!filterData,
    retry: 1, // Tentar apenas uma vez em caso de erro
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao enviar ofertas';
      alert(mensagem);
    },
  });

  const reofertaMutation = useMutation({
    mutationFn: async ({ rotaId, motoristaId }: { rotaId: string; motoristaId: string }) =>
      api.patch(`/ofertas-rotas/${rotaId}/editar`, { motoristaId }),
    onMutate: ({ rotaId }) => {
      setRotaReofertaEmProgresso(rotaId);
    },
    onSuccess: (_data, variables) => {
      alert('Oferta atualizada com sucesso!');
      setEditingRoutes((prev) => ({ ...prev, [variables.rotaId]: false }));
      setEditSelections((prev) => {
        const copia = { ...prev };
        delete copia[variables.rotaId];
        return copia;
      });
      queryClient.invalidateQueries({ queryKey: ['rotas-disponiveis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao atualizar oferta';
      alert(mensagem);
    },
    onSettled: () => {
      setRotaReofertaEmProgresso(null);
    },
  });

  const cancelarOfertaMutation = useMutation({
    mutationFn: async (rotaId: string) => api.delete(`/ofertas-rotas/${rotaId}`),
    onMutate: (rotaId) => {
      setRotaCancelamentoEmProgresso(rotaId);
    },
    onSuccess: (_data, rotaId) => {
      alert('Oferta removida e rota marcada como pendente.');
      setEditingRoutes((prev) => ({ ...prev, [rotaId]: false }));
      setEditSelections((prev) => {
        const copia = { ...prev };
        delete copia[rotaId];
        return copia;
      });
      queryClient.invalidateQueries({ queryKey: ['rotas-disponiveis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao cancelar ofertas da rota';
      alert(mensagem);
    },
    onSettled: () => {
      setRotaCancelamentoEmProgresso(null);
    },
  });

  // Verificar se motorista tem disponibilidade para a rota
  const motoristaTemDisponibilidade = (motoristaId: string, dataRota: string, ciclo: string): boolean => {
    const dataRotaObj = new Date(dataRota);
    if (Number.isNaN(dataRotaObj.getTime())) {
      return false;
    }

    const dataRotaStr = dataRotaObj.toISOString().split('T')[0];
    const cicloNormalizado = normalizarCiclo(ciclo);

    return disponibilidades.some((d: any) => {
      if (d.motoristaId !== motoristaId) {
        return false;
      }

      const dataDisponibilidade = new Date(d.data);
      if (Number.isNaN(dataDisponibilidade.getTime())) {
        return false;
      }

      const dataDisponibilidadeStr = dataDisponibilidade.toISOString().split('T')[0];
      if (dataDisponibilidadeStr !== dataRotaStr) {
        return false;
      }

      if (cicloNormalizado === 'SEMCICLO') {
        return d.disponivel !== false;
      }

      return normalizarCiclo(d.ciclo) === cicloNormalizado && d.disponivel !== false;
    });
  };

  // Filtrar motoristas elegíveis para uma rota
  const getMotoristasPorRota = (rota: Rota): Motorista[] => {
    // IDs dos motoristas já alocados (apenas nesta sessão, não no banco)
    const motoristasAlocados = new Set(
      alocacoes.filter((a) => a.rotaId !== rota.id).map((a) => a.motoristaId)
    );

    const motoristasBloqueadosSistema = new Set<string>();

    rotas.forEach((outraRota: any) => {
      if (outraRota.id === rota.id) return;
      if (!isSameDate(outraRota.dataRota, rota.dataRota)) return;
      if (normalizarCiclo(outraRota.cicloRota) !== normalizarCiclo(rota.cicloRota)) return;
      if (outraRota.tipoVeiculo !== rota.tipoVeiculo) return;

      if (['OFERTADA', 'ACEITA'].includes(outraRota.status)) {
        if (outraRota.motorista?.id) {
          motoristasBloqueadosSistema.add(outraRota.motorista.id);
        }

        outraRota.ofertas?.forEach((oferta: any) => {
          if (['PENDENTE', 'ACEITA'].includes(oferta.status) && oferta.motorista?.id) {
            motoristasBloqueadosSistema.add(oferta.motorista.id);
          }
        });
      }
    });

    return motoristas.filter((m: any) => {
      if (motoristasAlocados.has(m.id)) return false;

      if (motoristasBloqueadosSistema.has(m.id)) return false;

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

  // Desalocar motorista de uma rota
  const handleDesalocar = (rotaId: string) => {
    setAlocacoes((prev) => prev.filter((a) => a.rotaId !== rotaId));
  };

  const iniciarEdicao = (rota: Rota, motoristaAtualId?: string | null) => {
    setEditingRoutes((prev) => ({ ...prev, [rota.id]: true }));
    setEditSelections((prev) => ({
      ...prev,
      [rota.id]: motoristaAtualId ?? '',
    }));
    handleDesalocar(rota.id);
  };

  const cancelarEdicao = (rotaId: string) => {
    setEditingRoutes((prev) => ({ ...prev, [rotaId]: false }));
    setEditSelections((prev) => {
      const copia = { ...prev };
      delete copia[rotaId];
      return copia;
    });
  };

  const handleSelecaoEdicao = (rotaId: string, motoristaId: string) => {
    setEditSelections((prev) => ({ ...prev, [rotaId]: motoristaId }));
    if (!motoristaId) {
      return;
    }
    reofertaMutation.mutate({ rotaId, motoristaId });
  };

  const handleCancelarOferta = (rota: Rota) => {
    if (
      !window.confirm(
        'Deseja remover a oferta desta rota? Ela voltará para o status pendente.'
      )
    ) {
      return;
    }
    cancelarOfertaMutation.mutate(rota.id);
  };

  const isMotoristaElegivel = (motorista: any) => {
    if (!motorista || motorista.status !== 'ATIVO') return false;

    const anoAtual = new Date().getFullYear();

    if (motorista.anoFabricacaoVeiculo) {
      const idadeVeiculo = anoAtual - Number(motorista.anoFabricacaoVeiculo);
      if (idadeVeiculo > 15) return false;
    }

    const documento = motorista.documento || motorista.documentos?.[0];
    if (!documento) return false;

    if (!documento.numeroCNH) return false;

    if (documento.validadeCNH) {
      const validade = new Date(documento.validadeCNH);
      if (Number.isNaN(validade.getTime()) || validade < new Date()) {
        return false;
      }
    } else {
      return false;
    }

    if (documento.proximaVerificacaoBRK) {
      const proximaVerificacao = new Date(documento.proximaVerificacaoBRK);
      if (Number.isNaN(proximaVerificacao.getTime()) || proximaVerificacao < new Date()) {
        return false;
      }
    }

    if (!documento.statusBRK) return false;

    if (documento.anoLicenciamento) {
      if (Number(documento.anoLicenciamento) < anoAtual - 1) return false;
    } else {
      return false;
    }

    const possuiContratoAtivo = Array.isArray(motorista.contratos)
      ? motorista.contratos.length > 0
      : false;

    if (!possuiContratoAtivo) return false;

    return true;
  };

  const motoristasElegiveisCount = useMemo(
    () => motoristas.filter(isMotoristaElegivel).length,
    [motoristas]
  );

  const rotasPendentes = useMemo(
    () =>
      rotas.filter((rota) => rota.status === 'DISPONIVEL' || rota.status === 'RECUSADA')
        .length,
    [rotas]
  );

  const rotasAlocadas = useMemo(
    () =>
      rotas.filter((rota) =>
        ['OFERTADA', 'ACEITA', 'CONFIRMADA'].includes(rota.status)
      ).length,
    [rotas]
  );

  const rotasSemMotoristas = useMemo(() => {
    return rotas.filter((rota) => {
      if (rota.status !== 'DISPONIVEL') return false;
      const motoristasElegiveis = getMotoristasPorRota(rota);
      return motoristasElegiveis.length === 0;
    }).length;
  }, [rotas, motoristas, disponibilidades, alocacoes]);

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
      SAMEDAY: 'Same Day (Noite)',
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

  const formatDate = (dateString: string) => formatDatePtBr(dateString);

  const formatTime = (timeString: string) => toHourMinute(timeString);

  const isLoading = loadingRotas || loadingMotoristas;

  // Agrupar rotas por local de origem
  const rotasPorLocal = useMemo(() => {
    const grupos: Record<string, Rota[]> = {};

    rotas.forEach((rota) => {
      const nomeLocal = rota.local?.nome || 'Sem Local';
      if (!grupos[nomeLocal]) {
        grupos[nomeLocal] = [];
      }
      grupos[nomeLocal].push(rota);
    });

    return grupos;
  }, [rotas]);

  // Obter locais ordenados alfabeticamente (apenas com rotas)
  const locaisComRotas = useMemo(() => {
    return Object.keys(rotasPorLocal).sort();
  }, [rotasPorLocal]);

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
        <div className="flex items-center justify-between gap-4">
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
      </div>

      {/* Avisos de erro ou falta de dados */}
      {errorDisponibilidades && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Erro ao buscar disponibilidades</h3>
              <p className="text-sm text-red-700 mt-1">
                Não foi possível carregar as disponibilidades dos motoristas.
                {(disponibilidadesError as any)?.response?.status === 404
                  ? ' O endpoint de disponibilidades não foi encontrado. Verifique se o backend está rodando e configurado corretamente.'
                  : ` ${(disponibilidadesError as any)?.response?.data?.message || 'Erro desconhecido.'}`}
              </p>
              <p className="text-sm text-red-600 mt-2">
                <strong>Impacto:</strong> Nenhum motorista será considerado elegível até que as disponibilidades sejam carregadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {!errorDisponibilidades && disponibilidades.length === 0 && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Nenhuma disponibilidade encontrada</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Não há motoristas com disponibilidade cadastrada para o período selecionado.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                <strong>Impacto:</strong> Nenhum motorista será considerado elegível. Solicite aos motoristas que cadastrem suas disponibilidades.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Rotas sem Motoristas */}
      {rotasSemMotoristas > 0 && !isLoading && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-red-900 text-lg">{rotasSemMotoristas}</h3>
                <span className="text-red-900 font-semibold">
                  {rotasSemMotoristas === 1 ? 'Rota disponível' : 'Rotas disponíveis'} sem motoristas elegíveis
                </span>
              </div>
              <div className="mt-2 text-xs text-red-700">
                <p className="font-semibold">⚠️ Nenhum motorista elegível</p>
                <p className="mt-1">Verifique se há motoristas:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2">
                  <li>Com tipo de veículo: Large Van</li>
                  <li>Com status ATIVO</li>
                  <li>Com disponibilidade para {filterData ? formatDate(filterData) : '[data]'} - Ciclo 1 (Manhã)</li>
                  <li>Que ainda não foram alocados a outras rotas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{rotasPendentes}</p>
          <p className="text-xs text-yellow-700 mt-1">Status DISPONIVEL ou RECUSADA</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Rotas Alocadas</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{rotasAlocadas}</p>
          <p className="text-xs text-purple-700 mt-1">Status OFERTADA, ACEITA ou CONFIRMADA</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Motoristas Ativos &amp; Elegíveis</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{motoristasElegiveisCount}</p>
          <p className="text-xs text-green-700 mt-1">de {motoristas.length} motoristas ativos</p>
        </div>
      </div>

      {/* Lista de Rotas Agrupadas por Local */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados...</p>
          </div>
        ) : rotas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma rota disponível para alocação</p>
          </div>
        ) : (
          locaisComRotas.map((nomeLocal) => (
            <div key={nomeLocal} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Cabeçalho do Local */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-bold text-white">{nomeLocal}</h2>
                  <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {rotasPorLocal[nomeLocal].length} {rotasPorLocal[nomeLocal].length === 1 ? 'rota' : 'rotas'}
                  </span>
                </div>
              </div>

              {/* Rotas do Local */}
              <div className="divide-y divide-gray-200">
                {rotasPorLocal[nomeLocal].map((rota: Rota) => {
              const motoristasElegiveis = getMotoristasPorRota(rota);
              const alocacao = alocacoes.find((a) => a.rotaId === rota.id);
              const motoristaSelecionado = alocacao
                ? motoristas.find((m: any) => m.id === alocacao.motoristaId) || null
                : null;
              const ofertaAceita = rota.ofertas?.find((oferta) => oferta.status === 'ACEITA')?.motorista || null;
              const ofertaPendente = rota.ofertas?.find((oferta) => oferta.status === 'PENDENTE')?.motorista || null;
              const motoristaRelacionado =
                motoristaSelecionado || rota.motorista || ofertaAceita || ofertaPendente || null;
              const nomeMotoristaRelacionado = motoristaRelacionado?.nomeCompleto || 'Aguardando motorista';
              const podeAlocar = rota.status === 'DISPONIVEL' || rota.status === 'RECUSADA';
              const statusBadge = getStatusBadge(rota.status);
              const mensagemStatus =
                rota.status === 'OFERTADA'
                  ? 'Oferta enviada. Aguardando resposta do motorista.'
                  : rota.status === 'ACEITA'
                  ? 'Motorista aceitou a rota. Aguardando roteirização.'
                  : rota.status === 'RECUSADA'
                  ? 'Rota recusada. Selecione um novo motorista elegível.'
                  : null;
              const cardClassName =
                'p-3 transition ' + (rota.status === 'RECUSADA' ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50');
              const motoristaAtualId = motoristaRelacionado?.id ?? null;
              const estaEditando = editingRoutes[rota.id] === true;
              const selecaoEdicao = editSelections[rota.id] ?? (motoristaAtualId ?? '');
              const emReoferta = rotaReofertaEmProgresso === rota.id;
              const emCancelamento = rotaCancelamentoEmProgresso === rota.id;
              const motoristasParaEdicao = [...motoristasElegiveis];
              if (
                motoristaRelacionado &&
                motoristaAtualId &&
                !motoristasParaEdicao.some((m: any) => m.id === motoristaAtualId)
              ) {
                motoristasParaEdicao.unshift({
                  id: motoristaAtualId,
                  nomeCompleto: motoristaRelacionado.nomeCompleto,
                  tipoVeiculo: motoristaRelacionado.tipoVeiculo || rota.tipoVeiculo,
                });
              }

              return (
                <div key={rota.id} className={cardClassName}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* Informações da Rota */}
                    <div className="lg:col-span-7">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            {rota.codigoRota && (
                              <h3 className="text-base font-semibold text-gray-900 mb-1">
                                {rota.codigoRota}
                              </h3>
                            )}
                            <div className="mt-1 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(rota.dataRota)}</span>
                                <Clock className="w-4 h-4 ml-1" />
                                <span>
                                  {formatTime(rota.horaInicio)}
                                  {rota.horaFim && ` - ${formatTime(rota.horaFim)}`}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  {getCicloLabel(rota.cicloRota)}
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {getTipoVeiculoLabel(rota.tipoVeiculo)}
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {rota.tamanhoHoras}h
                                </span>
                                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                                  <DollarSign className="w-4 h-4" />
                                  {formatCurrency(rota.valorProjetado)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.classes}`}>
                            {statusBadge.label}
                          </span>
                          {['OFERTADA', 'ACEITA', 'CONFIRMADA'].includes(rota.status) && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  estaEditando
                                    ? cancelarEdicao(rota.id)
                                    : iniciarEdicao(rota, motoristaAtualId)
                                }
                                className={`inline-flex items-center justify-center w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition ${
                                  estaEditando ? 'bg-gray-100' : ''
                                }`}
                                disabled={emReoferta || emCancelamento}
                                title={estaEditando ? 'Cancelar edição' : 'Editar oferta'}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelarOferta(rota)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded border border-red-200 text-red-600 hover:bg-red-50 transition"
                                disabled={emCancelamento}
                                title="Excluir oferta e voltar para pendente"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seleção de Motorista */}
                    <div className="lg:col-span-5">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {podeAlocar ? 'Selecionar Motorista' : 'Motorista vinculado'}
                      </label>

                      {podeAlocar ? (
                        <>
                          <div className="flex gap-1">
                            <select
                              value={alocacao?.motoristaId || ''}
                              onChange={(e) => handleAlocar(rota.id, e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">-- Selecione um motorista --</option>
                              {motoristasElegiveis.map((motorista: any) => (
                                <option key={motorista.id} value={motorista.id}>
                                  {motorista.nomeCompleto} - {getTipoVeiculoLabel(motorista.tipoVeiculo)}
                                </option>
                              ))}
                            </select>
                            {alocacao && (
                              <button
                                onClick={() => handleDesalocar(rota.id)}
                                className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded transition"
                                title="Desalocar motorista"
                              >
                                <span className="text-base font-bold">×</span>
                              </button>
                            )}
                          </div>

                          {alocacao && motoristaSelecionado && (
                            <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Motorista alocado: {motoristaSelecionado.nomeCompleto}
                            </p>
                          )}

                          {rota.status === 'RECUSADA' && (
                            <p className="mt-2 text-xs text-red-600">
                              A última oferta foi recusada. Realize uma nova alocação para reenviar.
                            </p>
                          )}
                        </>
                      ) : estaEditando ? (
                        <>
                          <div className="flex gap-1">
                            <select
                              value={selecaoEdicao}
                              onChange={(e) => handleSelecaoEdicao(rota.id, e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={emReoferta}
                            >
                              <option value="">-- Selecione um motorista --</option>
                              {motoristasParaEdicao.map((motorista: any) => (
                                <option key={motorista.id} value={motorista.id}>
                                  {motorista.nomeCompleto} - {getTipoVeiculoLabel(motorista.tipoVeiculo)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => cancelarEdicao(rota.id)}
                              className="px-2 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100 transition"
                              disabled={emReoferta}
                            >
                              Cancelar
                            </button>
                          </div>
                          <p className="mt-2 text-xs text-gray-600">
                            Selecione um motorista elegível para reenviar a oferta desta rota.
                          </p>
                          {emReoferta && (
                            <p className="mt-2 text-xs text-blue-600">Atualizando oferta...</p>
                          )}
                        </>
                      ) : (
                        <div className="p-2 bg-gray-100 border border-gray-200 rounded">
                          <p className="text-xs text-gray-500">Motorista</p>
                          <p className="text-sm font-semibold text-gray-900">{nomeMotoristaRelacionado}</p>
                          {mensagemStatus && (
                            <p className="text-xs text-gray-600 mt-1">{mensagemStatus}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          ))
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
                    {rota?.codigoRota && <strong>{rota.codigoRota} - </strong>}
                    {formatDate(rota?.dataRota || '')} - {rota?.local?.nome || 'Sem Local'}
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
