import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Users,
  UserX
} from 'lucide-react';
import { FiltrosPeriodo } from '../../components/disponibilidade/FiltrosPeriodo';
import api from '../../services/api';
import {
  CicloRota,
  TipoVeiculo,
  CICLOS_TITULOS,
  CICLOS_HORARIOS,
  TIPO_VEICULO_LABELS
} from '../../types/disponibilidade';
import { formatarDataISO, getFimSemana, getInicioSemana } from '../../utils/disponibilidade.utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewMode = 'dia' | 'motorista';

interface DisponibilidadeRegistro {
  id: string;
  motoristaId: string;
  data: string;
  ciclo: CicloRota | string;
  disponivel: boolean;
  motorista?: {
    nomeCompleto?: string;
    tipoVeiculo?: TipoVeiculo | string;
  };
}

interface DocumentoMotorista {
  numeroCNH?: string | null;
  validadeCNH?: string | null;
  anoLicenciamento?: number | null;
  statusBRK?: boolean | null;
}

interface MotoristaGestao {
  id: string;
  nome?: string;
  nomeCompleto?: string;
  cidade?: string;
  uf?: string;
  celular?: string;
  tipoVeiculo?: TipoVeiculo | string;
  status?: string;
  documento?: DocumentoMotorista | null;
  documentos?: DocumentoMotorista[];
}

interface MotoristaDetalhado {
  id: string;
  nomeCompleto: string;
  cidade?: string;
  uf?: string;
  celular?: string;
  tipoVeiculo?: TipoVeiculo;
  status?: string;
  documento?: DocumentoMotorista | null;
}

interface MotoristaDiaResumo {
  data: string;
  ciclos: CicloRota[];
}

interface MotoristaDisponibilidadeResumo {
  id: string;
  nomeCompleto: string;
  tipoVeiculo?: TipoVeiculo;
  celular?: string;
  cidade?: string;
  uf?: string;
  totalSlots: number;
  dias: MotoristaDiaResumo[];
}

interface TipoGroup {
  tipoVeiculo: TipoVeiculo;
  total: number;
  motoristas: Array<{
    id: string;
    nomeCompleto: string;
    tipoVeiculo?: TipoVeiculo;
  }>;
}

interface CicloGroup {
  ciclo: CicloRota;
  total: number;
  totalMotoristas: number;
  tipos: TipoGroup[];
}

interface DiaGroup {
  data: string;
  total: number;
  totalMotoristas: number;
  ciclos: CicloGroup[];
}

const ciclosOrdem: CicloRota[] = [CicloRota.CICLO_1, CicloRota.CICLO_2, CicloRota.SAME_DAY];
const tiposVeiculoOrdem = Object.values(TipoVeiculo) as TipoVeiculo[];

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

const formatarDiaCompleto = (isoDate: string) => {
  const texto = format(new Date(`${isoDate}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR });
  return capitalizar(texto);
};

const formatarDiaCurto = (isoDate: string) =>
  format(new Date(`${isoDate}T00:00:00`), 'dd/MM', { locale: ptBR });

const formatarDiaSemanaCurto = (isoDate: string) =>
  capitalizar(format(new Date(`${isoDate}T00:00:00`), 'EEE', { locale: ptBR }));

const extrairDocumentoPrincipal = (motorista: MotoristaGestao): DocumentoMotorista | null => {
  if (motorista.documento && !Array.isArray(motorista.documento)) {
    return motorista.documento;
  }

  if (Array.isArray(motorista.documentos) && motorista.documentos.length > 0) {
    return motorista.documentos[0];
  }

  return null;
};

const gerarLinkWhatsapp = (celular?: string) => {
  if (!celular) return null;
  const digits = celular.replace(/\D/g, '');
  if (!digits) return null;
  return `https://api.whatsapp.com/send?phone=55${digits}&text=Oi!+Aqui+%C3%A9+a+Temelio.`;
};

const motoristaElegivel = (motorista: MotoristaDetalhado) => {
  const documento = motorista.documento;
  if (!documento) return false;

  const temDocumentos =
    Boolean(documento.numeroCNH) &&
    Boolean(documento.validadeCNH) &&
    (documento.anoLicenciamento !== null && documento.anoLicenciamento !== undefined);

  const validadeCNH = documento.validadeCNH ? new Date(documento.validadeCNH) : null;
  const cnhValida = validadeCNH ? validadeCNH > new Date() : false;
  const brkValido = documento.statusBRK === true;

  return temDocumentos && cnhValida && brkValido;
};

export default function GestaoDisponibilidades() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'corrente' | 'proxima' | 'customizado'>('corrente');
  const [dataInicioCustom, setDataInicioCustom] = useState<string>('');
  const [dataFimCustom, setDataFimCustom] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('dia');
  const [expandedDias, setExpandedDias] = useState<Set<string>>(new Set());
  const [expandedCiclos, setExpandedCiclos] = useState<Set<string>>(new Set());

  const periodo = useMemo(() => {
    const hoje = new Date();
    let inicio: Date;
    let fim: Date;

    if (periodoSelecionado === 'corrente') {
      inicio = getInicioSemana(hoje);
      fim = getFimSemana(hoje);
    } else if (periodoSelecionado === 'proxima') {
      const fimSemanaCorrente = getFimSemana(hoje);
      inicio = new Date(fimSemanaCorrente);
      inicio.setDate(inicio.getDate() + 1);
      fim = getFimSemana(inicio);
    } else {
      if (dataInicioCustom && dataFimCustom) {
        inicio = new Date(dataInicioCustom);
        fim = new Date(dataFimCustom);
      } else {
        inicio = getInicioSemana(hoje);
        fim = getFimSemana(hoje);
      }
    }

    if (inicio > fim) {
      const temp = inicio;
      inicio = fim;
      fim = temp;
    }

    const datas: Date[] = [];
    const cursor = new Date(inicio);
    const limiteDias = 31;

    while (cursor <= fim && datas.length < limiteDias) {
      datas.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    if (datas.length === 0) {
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicio);
        dia.setDate(inicio.getDate() + i);
        datas.push(dia);
      }
      fim = datas[datas.length - 1];
    }

    return {
      inicioISO: formatarDataISO(inicio),
      fimISO: formatarDataISO(fim),
      datas
    };
  }, [periodoSelecionado, dataInicioCustom, dataFimCustom]);

  const {
    data: disponibilidades = [],
    isLoading: carregandoDisponibilidades,
    error: erroDisponibilidades,
    refetch: refetchDisponibilidades
  } = useQuery<DisponibilidadeRegistro[]>({
    queryKey: ['gestao-disponibilidades-intervalo', periodo.inicioISO, periodo.fimISO],
    queryFn: async () => {
      if (!periodo.inicioISO || !periodo.fimISO) return [];
      const params = new URLSearchParams({
        dataInicio: periodo.inicioISO,
        dataFim: periodo.fimISO,
        disponivel: 'true'
      });
      const response = await api.get(`/gestao/disponibilidades/intervalo?${params.toString()}`);
      const dados = response.data?.data ?? response.data;
      return Array.isArray(dados) ? dados : [];
    },
    enabled: Boolean(periodo.inicioISO && periodo.fimISO)
  });

  const {
    data: motoristas = [],
    isLoading: carregandoMotoristas,
    error: erroMotoristas,
    refetch: refetchMotoristas
  } = useQuery<MotoristaGestao[]>({
    queryKey: ['gestao-motoristas', 'ativos'],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'ATIVO',
        limit: '500'
      });
      const response = await api.get(`/gestao/motoristas?${params.toString()}`);
      const dados = response.data?.data?.motoristas ?? response.data?.motoristas ?? response.data;
      return Array.isArray(dados) ? dados : [];
    }
  });

  const motoristasDetalhados = useMemo<MotoristaDetalhado[]>(() => {
    return motoristas.map((motorista) => ({
      id: motorista.id,
      nomeCompleto: motorista.nomeCompleto || motorista.nome || 'Motorista sem nome',
      cidade: motorista.cidade,
      uf: motorista.uf,
      celular: motorista.celular,
      tipoVeiculo: (motorista.tipoVeiculo as TipoVeiculo) || undefined,
      status: motorista.status,
      documento: extrairDocumentoPrincipal(motorista)
    }));
  }, [motoristas]);

  const motoristasMap = useMemo(() => {
    const map = new Map<string, MotoristaDetalhado>();
    motoristasDetalhados.forEach((motorista) => {
      map.set(motorista.id, motorista);
    });
    return map;
  }, [motoristasDetalhados]);

  const motoristasDisponiveisSet = useMemo(() => {
    const set = new Set<string>();
    disponibilidades.forEach((disp) => {
      if (disp.disponivel) {
        set.add(disp.motoristaId);
      }
    });
    return set;
  }, [disponibilidades]);

  const diasAgrupados = useMemo<DiaGroup[]>(() => {
    if (periodo.datas.length === 0) return [];

    type DiaGroupInternal = {
      data: string;
      total: number;
      totalMotoristas: number;
      ciclos: Record<string, {
        ciclo: CicloRota;
        total: number;
        totalMotoristas: number;
        tipos: Record<string, {
          tipoVeiculo: TipoVeiculo;
          motoristas: Array<{ id: string; nomeCompleto: string; tipoVeiculo?: TipoVeiculo }>;
        }>;
        motoristaIds: Set<string>;
      }>;
      motoristaIds: Set<string>;
    };

    const mapaDias: Record<string, DiaGroupInternal> = {};

    periodo.datas.forEach((data) => {
      const iso = formatarDataISO(data);
      mapaDias[iso] = {
        data: iso,
        total: 0,
        totalMotoristas: 0,
        motoristaIds: new Set<string>(),
        ciclos: ciclosOrdem.reduce((acc, ciclo) => {
          acc[ciclo] = {
            ciclo,
            total: 0,
            totalMotoristas: 0,
            motoristaIds: new Set<string>(),
            tipos: tiposVeiculoOrdem.reduce((tiposAcc, tipo) => {
              tiposAcc[tipo] = {
                tipoVeiculo: tipo,
                motoristas: []
              };
              return tiposAcc;
            }, {} as Record<string, { tipoVeiculo: TipoVeiculo; motoristas: Array<{ id: string; nomeCompleto: string; tipoVeiculo?: TipoVeiculo }> }>)
          };
          return acc;
        }, {} as DiaGroupInternal['ciclos'])
      };
    });

    disponibilidades.forEach((registro) => {
      if (!registro.disponivel) return;

      const dataISO = formatarDataISO(new Date(registro.data));
      const dia = mapaDias[dataISO];
      if (!dia) return;

      const ciclo = (registro.ciclo as CicloRota) ?? CicloRota.CICLO_1;
      const cicloGroup = dia.ciclos[ciclo];
      if (!cicloGroup) return;

      const infoMotorista = motoristasMap.get(registro.motoristaId);
      const nomeCompleto =
        infoMotorista?.nomeCompleto ||
        registro.motorista?.nomeCompleto ||
        'Motorista sem nome';

      const tipoVeiculo =
        (registro.motorista?.tipoVeiculo as TipoVeiculo) ||
        infoMotorista?.tipoVeiculo ||
        TipoVeiculo.CARGO_VAN;

      const tipoGroup = cicloGroup.tipos[tipoVeiculo] ?? {
        tipoVeiculo,
        motoristas: [] as Array<{ id: string; nomeCompleto: string; tipoVeiculo?: TipoVeiculo }>
      };

      const jaExiste = tipoGroup.motoristas.some((m) => m.id === registro.motoristaId);
      if (jaExiste) {
        cicloGroup.tipos[tipoVeiculo] = tipoGroup;
        return;
      }

      tipoGroup.motoristas.push({
        id: registro.motoristaId,
        nomeCompleto,
        tipoVeiculo
      });

      cicloGroup.tipos[tipoVeiculo] = tipoGroup;
      cicloGroup.total += 1;
      cicloGroup.motoristaIds.add(registro.motoristaId);
      cicloGroup.totalMotoristas = cicloGroup.motoristaIds.size;

      dia.total += 1;
      dia.motoristaIds.add(registro.motoristaId);
      dia.totalMotoristas = dia.motoristaIds.size;
    });

    return Object.values(mapaDias)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((dia) => ({
        data: dia.data,
        total: dia.total,
        totalMotoristas: dia.totalMotoristas,
        ciclos: ciclosOrdem.map((ciclo) => {
          const cicloInfo = dia.ciclos[ciclo] ?? {
            ciclo,
            total: 0,
            totalMotoristas: 0,
            tipos: tiposVeiculoOrdem.reduce((acc, tipo) => {
              acc[tipo] = {
                tipoVeiculo: tipo,
                motoristas: []
              };
              return acc;
            }, {} as Record<string, { tipoVeiculo: TipoVeiculo; motoristas: Array<{ id: string; nomeCompleto: string; tipoVeiculo?: TipoVeiculo }> }>),
            motoristaIds: new Set<string>()
          };

          return {
            ciclo,
            total: cicloInfo.total,
            totalMotoristas: cicloInfo.totalMotoristas,
            tipos: tiposVeiculoOrdem.map((tipo) => {
              const tipoInfo = cicloInfo.tipos[tipo] ?? {
                tipoVeiculo: tipo,
                motoristas: []
              };

              return {
                tipoVeiculo: tipo,
                total: tipoInfo.motoristas.length,
                motoristas: tipoInfo.motoristas
                  .slice()
                  .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR'))
              };
            })
          };
        })
      }));
  }, [disponibilidades, motoristasMap, periodo.datas]);

  const disponibilidadePorMotorista = useMemo<MotoristaDisponibilidadeResumo[]>(() => {
    const mapa = new Map<string, {
      id: string;
      nomeCompleto: string;
      tipoVeiculo?: TipoVeiculo;
      celular?: string;
      cidade?: string;
      uf?: string;
      totalSlots: number;
      porDia: Record<string, Set<CicloRota>>;
    }>();

    disponibilidades.forEach((registro) => {
      if (!registro.disponivel) return;

      const existente = mapa.get(registro.motoristaId);
      const infoMotorista = motoristasMap.get(registro.motoristaId);
      const nomeCompleto =
        infoMotorista?.nomeCompleto ||
        registro.motorista?.nomeCompleto ||
        'Motorista sem nome';
      const tipoVeiculo =
        infoMotorista?.tipoVeiculo ||
        (registro.motorista?.tipoVeiculo as TipoVeiculo) ||
        TipoVeiculo.CARGO_VAN;

      const dataISO = formatarDataISO(new Date(registro.data));
      const ciclo = registro.ciclo as CicloRota;

      if (!existente) {
        mapa.set(registro.motoristaId, {
          id: registro.motoristaId,
          nomeCompleto,
          tipoVeiculo,
          celular: infoMotorista?.celular,
          cidade: infoMotorista?.cidade,
          uf: infoMotorista?.uf,
          totalSlots: 1,
          porDia: {
            [dataISO]: new Set<CicloRota>([ciclo])
          }
        });
        return;
      }

      existente.totalSlots += 1;
      if (!existente.porDia[dataISO]) {
        existente.porDia[dataISO] = new Set<CicloRota>();
      }
      existente.porDia[dataISO].add(ciclo);
    });

    const lista: MotoristaDisponibilidadeResumo[] = Array.from(mapa.values()).map((valor) => ({
      id: valor.id,
      nomeCompleto: valor.nomeCompleto,
      tipoVeiculo: valor.tipoVeiculo,
      celular: valor.celular,
      cidade: valor.cidade,
      uf: valor.uf,
      totalSlots: valor.totalSlots,
      dias: Object.entries(valor.porDia)
        .map(([data, ciclos]) => ({
          data,
          ciclos: Array.from(ciclos).sort((a, b) => ciclosOrdem.indexOf(a) - ciclosOrdem.indexOf(b))
        }))
        .sort((a, b) => a.data.localeCompare(b.data))
    }));

    return lista.sort((a, b) => {
      if (b.totalSlots !== a.totalSlots) return b.totalSlots - a.totalSlots;
      return a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR');
    });
  }, [disponibilidades, motoristasMap]);

  const motoristasSemDisponibilidade = useMemo(() => {
    return motoristasDetalhados.filter((motorista) => {
      const statusAtivo = motorista.status?.toUpperCase() === 'ATIVO';
      return statusAtivo && motoristaElegivel(motorista) && !motoristasDisponiveisSet.has(motorista.id);
    });
  }, [motoristasDetalhados, motoristasDisponiveisSet]);

  const totalSlots = disponibilidadePorMotorista.reduce((acc, item) => acc + item.totalSlots, 0);
  const totalMotoristasComDisponibilidade = disponibilidadePorMotorista.length;

  const carregando = carregandoDisponibilidades || carregandoMotoristas;

  const handleAtualizar = () => {
    refetchDisponibilidades();
    refetchMotoristas();
  };

  const toggleDia = (dia: string) => {
    setExpandedDias((prev) => {
      const novo = new Set(prev);
      if (novo.has(dia)) {
        novo.delete(dia);
      } else {
        novo.add(dia);
      }
      return novo;
    });
  };

  const toggleCiclo = (dia: string, ciclo: CicloRota) => {
    setExpandedCiclos((prev) => {
      const chave = `${dia}-${ciclo}`;
      const novo = new Set(prev);
      if (novo.has(chave)) {
        novo.delete(chave);
      } else {
        novo.add(chave);
      }
      return novo;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidades dos Motoristas</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe a disponibilidade por dia, ciclo e tipo de veículo ou analise por motorista.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
            <button
              type="button"
              onClick={() => setViewMode('dia')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                viewMode === 'dia'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por dia
            </button>
            <button
              type="button"
              onClick={() => setViewMode('motorista')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                viewMode === 'motorista'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por motorista
            </button>
          </div>
          <button
            type="button"
            onClick={handleAtualizar}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            disabled={carregando}
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      <FiltrosPeriodo
        periodoSelecionado={periodoSelecionado}
        onChangePeriodo={setPeriodoSelecionado}
        dataInicio={dataInicioCustom}
        dataFim={dataFimCustom}
        onChangeDataInicio={setDataInicioCustom}
        onChangeDataFim={setDataFimCustom}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-3">
          <Users className="w-10 h-10 text-blue-600 bg-blue-50 rounded-full p-2" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Motoristas com disponibilidade
            </p>
            <p className="text-xl font-semibold text-gray-900">{totalMotoristasComDisponibilidade}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-3">
          <CalendarDays className="w-10 h-10 text-green-600 bg-green-50 rounded-full p-2" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Slots registrados
            </p>
            <p className="text-xl font-semibold text-gray-900">{totalSlots}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-3">
          <UserX className="w-10 h-10 text-amber-600 bg-amber-50 rounded-full p-2" />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Sem disponibilidade
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {motoristasSemDisponibilidade.length}
            </p>
          </div>
        </div>
      </div>

      {(erroDisponibilidades || erroMotoristas) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
          <div>
            <p className="font-semibold text-red-800">
              Não foi possível carregar todas as informações.
            </p>
            <p className="text-sm text-red-700 mt-1">
              {((erroDisponibilidades as any)?.response?.data?.message ||
                (erroMotoristas as any)?.response?.data?.message ||
                (erroDisponibilidades as Error)?.message ||
                (erroMotoristas as Error)?.message ||
                'Tente novamente em instantes.')}
            </p>
            <button
              type="button"
              onClick={handleAtualizar}
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="bg-white border border-gray-100 rounded-lg py-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-600">Carregando disponibilidades...</p>
        </div>
      ) : viewMode === 'dia' ? (
        <div className="space-y-4">
          {diasAgrupados.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-lg p-8 text-center text-gray-600">
              Nenhum dado disponível para o período selecionado.
            </div>
          ) : (
            diasAgrupados.map((dia) => {
              const aberto = expandedDias.has(dia.data);

              return (
                <div key={dia.data} className="bg-white border border-gray-100 rounded-lg shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleDia(dia.data)}
                    className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        {formatarDiaSemanaCurto(dia.data)} • {formatarDiaCurto(dia.data)}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatarDiaCompleto(dia.data)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {dia.total} disponibilidade{dia.total === 1 ? '' : 's'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dia.totalMotoristas} motorista{dia.totalMotoristas === 1 ? '' : 's'} único{dia.totalMotoristas === 1 ? '' : 's'}
                        </p>
                      </div>
                      {aberto ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {aberto && (
                    <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                      {dia.ciclos.map((ciclo) => {
                        const key = `${dia.data}-${ciclo.ciclo}`;
                        const cicloAberto = expandedCiclos.has(key);
                        const tiposComMotoristas = ciclo.tipos.filter((tipo) => tipo.motoristas.length > 0);

                        return (
                          <div key={ciclo.ciclo} className="border border-gray-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => toggleCiclo(dia.data, ciclo.ciclo)}
                              className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {CICLOS_TITULOS[ciclo.ciclo]}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {CICLOS_HORARIOS[ciclo.ciclo]}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {ciclo.total} disponibilidade{ciclo.total === 1 ? '' : 's'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {ciclo.totalMotoristas} motorista{ciclo.totalMotoristas === 1 ? '' : 's'}
                                  </p>
                                </div>
                                {cicloAberto ? (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                            </button>

                            {cicloAberto && (
                              <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-3">
                                {tiposComMotoristas.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">
                                    Nenhum motorista informou disponibilidade para este ciclo.
                                  </p>
                                ) : (
                                  tiposComMotoristas.map((tipo) => (
                                    <div key={tipo.tipoVeiculo} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-800">
                                          {TIPO_VEICULO_LABELS[tipo.tipoVeiculo]}
                                        </p>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                          {tipo.total} motorista{tipo.total === 1 ? '' : 's'}
                                        </span>
                                      </div>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {tipo.motoristas.map((motorista) => (
                                          <span
                                            key={motorista.id}
                                            className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-full"
                                          >
                                            {motorista.nomeCompleto}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {motoristasSemDisponibilidade.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900">
                    Motoristas ativos e elegíveis sem disponibilidade registrada
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Entre em contato para garantir que as disponibilidades estejam atualizadas.
                  </p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {motoristasSemDisponibilidade.map((motorista) => {
                      const whatsappLink = gerarLinkWhatsapp(motorista.celular);
                      return (
                        <div
                          key={motorista.id}
                          className="bg-white border border-amber-100 rounded-lg px-3 py-3 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-amber-900">
                              {motorista.nomeCompleto}
                            </p>
                            <p className="text-xs text-amber-700">
                              {TIPO_VEICULO_LABELS[motorista.tipoVeiculo ?? TipoVeiculo.CARGO_VAN]}
                              {motorista.cidade ? ` · ${motorista.cidade}` : ''}
                              {motorista.uf ? `/${motorista.uf}` : ''}
                            </p>
                          </div>
                          {whatsappLink ? (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 transition px-3 py-1 rounded-full"
                            >
                              WhatsApp
                            </a>
                          ) : (
                            <span className="text-xs text-amber-400 italic">Sem contato</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {disponibilidadePorMotorista.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-lg p-8 text-center text-gray-600">
              Nenhum motorista registrou disponibilidade no período selecionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {disponibilidadePorMotorista.map((motorista) => {
                const whatsappLink = gerarLinkWhatsapp(motorista.celular);

                return (
                  <div key={motorista.id} className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-4 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {motorista.nomeCompleto}
                        </p>
                        <p className="text-sm text-gray-500">
                          {TIPO_VEICULO_LABELS[motorista.tipoVeiculo ?? TipoVeiculo.CARGO_VAN]}
                          {motorista.cidade ? ` · ${motorista.cidade}` : ''}
                          {motorista.uf ? `/${motorista.uf}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          {motorista.totalSlots} disponibilidade{motorista.totalSlots === 1 ? '' : 's'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {motorista.dias.length} dia{motorista.dias.length === 1 ? '' : 's'} no período
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-4">
                      <div className="flex flex-wrap gap-3">
                        {motorista.dias.map((dia) => (
                          <div key={`${motorista.id}-${dia.data}`} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <p className="text-sm font-semibold text-blue-900">
                              {formatarDiaSemanaCurto(dia.data)} • {formatarDiaCurto(dia.data)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {dia.ciclos.map((ciclo) => (
                                <span
                                  key={`${motorista.id}-${dia.data}-${ciclo}`}
                                  className="inline-flex items-center px-2 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-full"
                                >
                                  {CICLOS_TITULOS[ciclo]}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {whatsappLink && (
                      <div className="px-4 pb-4">
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                        >
                          Falar no WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
