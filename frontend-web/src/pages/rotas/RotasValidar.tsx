import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, TrendingUp, MapPin, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const VALOR_POR_KM = 0.50;

interface Rota {
  id: string;
  codigoRota: string;
  dataRota: string;
  valorProjetado: number;
  kmProjetado: number;
  tipoVeiculo: string;
  cicloRota: string;
  local?: {
    nome: string;
  };
  motorista?: {
    nomeCompleto: string;
    celular: string;
  };
}

export default function RotasValidar() {
  // Data padrão: dia anterior
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const [selectedDate, setSelectedDate] = useState(yesterday.toISOString().split('T')[0]);
  
  const [kmValues, setKmValues] = useState<Record<string, number>>({});
  
  const queryClient = useQueryClient();

  // Buscar rotas para validação
  const { data: rotas = [], isLoading } = useQuery({
    queryKey: ['rotas-validacao', selectedDate],
    queryFn: async () => {
      try {
        const response = await api.get('/rotas/validacao', {
          params: { data: selectedDate }
        });
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        
        // Inicializar valores de KM com KM projetado
        if (Array.isArray(dados)) {
          const initialKm: Record<string, number> = {};
          dados.forEach((rota: any) => {
            initialKm[rota.id] = rota.kmProjetado || 50;
          });
          setKmValues(initialKm);
          return dados;
        }
        return [];
      } catch (error) {
        console.error('Erro ao buscar rotas para validação:', error);
        return [];
      }
    },
  });

  // Validar rotas em lote
  const validarMutation = useMutation({
    mutationFn: async (rotas: Array<{ rotaId: string; kmReal: number }>) => {
      return api.post('/rotas/validar-lote', { rotas });
    },
    onSuccess: (data) => {
      const resultado = data.data?.data || data.data;
      alert(`${resultado.validadas} rotas validadas com sucesso!\n${resultado.falhas} falhas.`);
      queryClient.invalidateQueries({ queryKey: ['rotas-validacao'] });
      queryClient.invalidateQueries({ queryKey: ['rotas'] });
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || 'Erro ao validar rotas';
      alert(mensagem);
      console.error('Erro:', error.response?.data);
    },
  });

  const handleKmChange = (rotaId: string, km: number) => {
    setKmValues(prev => ({
      ...prev,
      [rotaId]: km
    }));
  };

  const handleValidarTodas = () => {
    // Preparar dados
    const rotasParaValidar = rotas
      .filter((r: any) => kmValues[r.id] && kmValues[r.id] > 0)
      .map((r: any) => ({
        rotaId: r.id,
        kmReal: kmValues[r.id]
      }));

    if (rotasParaValidar.length === 0) {
      alert('Nenhuma rota com KM preenchido para validar!');
      return;
    }

    if (window.confirm(`Confirma a validação de ${rotasParaValidar.length} rotas?`)) {
      validarMutation.mutate(rotasParaValidar);
    }
  };

  const calcularValorFinal = (valorProjetado: number, kmReal: number) => {
    const bonusKm = kmReal * VALOR_POR_KM;
    return valorProjetado + bonusKm;
  };

  const calcularTotais = () => {
    let totalKmProjetado = 0;
    let totalKmReal = 0;
    let totalValorProjetado = 0;
    let totalValorFinal = 0;

    rotas.forEach((rota: any) => {
      totalKmProjetado += rota.kmProjetado || 0;
      totalKmReal += kmValues[rota.id] || 0;
      totalValorProjetado += Number(rota.valorProjetado) || 0;
      totalValorFinal += calcularValorFinal(Number(rota.valorProjetado) || 0, kmValues[rota.id] || 0);
    });

    return { totalKmProjetado, totalKmReal, totalValorProjetado, totalValorFinal };
  };

  const totais = calcularTotais();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCicloLabel = (ciclo: string) => {
    const labels: Record<string, string> = {
      CICLO_1: 'C1',
      CICLO_2: 'C2',
      SAME_DAY: 'Same Day',
      SEM_CICLO: '-',
    };
    return labels[ciclo] || ciclo;
  };

  const getTipoVeiculoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      MOTOCICLETA: 'Moto',
      CARRO_PASSEIO: 'Carro',
      CARGO_VAN: 'Van C',
      LARGE_VAN: 'Van G',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validar Rotas (D+1)</h1>
          <p className="text-gray-600 mt-1">
            Informe os KM reais rodados para calcular o valor final das rotas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Data de Referência:</label>
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rotas a Validar</p>
              <p className="text-2xl font-bold text-blue-900">{rotas.length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">KM Total Real</p>
              <p className="text-2xl font-bold text-purple-900">{totais.totalKmReal.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Projetado</p>
              <p className="text-xl font-bold text-green-900">{formatCurrency(totais.totalValorProjetado)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Final</p>
              <p className="text-xl font-bold text-emerald-900">{formatCurrency(totais.totalValorFinal)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Botão Validar Todas */}
      {rotas.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleValidarTodas}
            disabled={validarMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
          >
            <Save className="w-5 h-5" />
            {validarMutation.isPending ? 'Validando...' : `Validar Todas (${rotas.length})`}
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando rotas...</p>
          </div>
        ) : rotas.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma rota concluída encontrada para validação</p>
            <p className="text-sm text-gray-500 mt-2">
              Selecione outra data ou aguarde as rotas serem concluídas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motorista
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Local
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Ciclo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Veículo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    KM Proj.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    KM Real *
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor Projetado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Bônus KM
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor Final
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rotas.map((rota: any) => {
                  const kmReal = kmValues[rota.id] || 0;
                  const valorProjetado = Number(rota.valorProjetado) || 0;
                  const bonusKm = kmReal * VALOR_POR_KM;
                  const valorFinal = calcularValorFinal(valorProjetado, kmReal);

                  return (
                    <tr key={rota.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {rota.codigoRota}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {rota.motorista?.nomeCompleto || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rota.motorista?.celular || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {rota.local?.nome || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getCicloLabel(rota.cicloRota)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        {getTipoVeiculoLabel(rota.tipoVeiculo)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {rota.kmProjetado || 0} km
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={kmReal}
                          onChange={(e) => handleKmChange(rota.id, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(valorProjetado)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                        +{formatCurrency(bonusKm)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-emerald-600">
                          {formatCurrency(valorFinal)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr className="font-bold">
                  <td colSpan={5} className="px-4 py-3 text-right text-gray-900">
                    TOTAIS:
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {totais.totalKmProjetado.toFixed(0)} km
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900">
                    {totais.totalKmReal.toFixed(0)} km
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {formatCurrency(totais.totalValorProjetado)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    +{formatCurrency(totais.totalKmReal * VALOR_POR_KM)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 text-lg">
                    {formatCurrency(totais.totalValorFinal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      {rotas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Instruções:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Informe o KM real rodado em cada rota</li>
                <li>O bônus por KM é calculado automaticamente (R$ {VALOR_POR_KM.toFixed(2)}/km)</li>
                <li>Após preencher todos os KM, clique em "Validar Todas" para salvar</li>
                <li>As rotas validadas terão o valor final calculado e serão pagas aos motoristas</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}