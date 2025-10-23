// frontend/src/pages/disponibilidade/ResumoDisponibilidade.tsx
import { useState } from 'react';
import { RefreshCw, Download, FileDown, Clock } from 'lucide-react';
import { FiltrosPeriodo } from '../../components/disponibilidade/FiltrosPeriodo';
import { TabelaResumo } from '../../components/disponibilidade/TabelaResumo';
import { ModalMotoristas } from '../../components/disponibilidade/ModalMotoristas';
import { useResumoDisponibilidade } from '../../hooks/useResumoDisponibilidade';
import { getInicioSemana, getFimSemana } from '../../utils/disponibilidade.utils';
import { exportarCSV, exportarExcel, prepararDadosResumo, gerarNomeArquivo } from '../../utils/export.utils';
import { toast } from 'react-hot-toast';

export default function GestaoDisponibilidadesResumo() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'corrente' | 'proxima' | 'customizado'>('corrente');
  const [dataInicioCustom, setDataInicioCustom] = useState<string>('');
  const [dataFimCustom, setDataFimCustom] = useState<string>('');

  // Calcular datas baseado no período selecionado
  const calcularDatas = (): { inicio: string; fim: string; datas: Date[] } => {
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
      // Customizado
      if (!dataInicioCustom || !dataFimCustom) {
        // Fallback para semana corrente
        inicio = getInicioSemana(hoje);
        fim = getFimSemana(hoje);
      } else {
        inicio = new Date(dataInicioCustom);
        fim = new Date(dataFimCustom);
      }
    }

    // Gerar array de datas
    const datas: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + i);
      datas.push(data);
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0],
      datas
    };
  };

  const { inicio: dataInicio, fim: dataFim, datas } = calcularDatas();

  const {
    resumo,
    isLoading,
    error,
    refetch,
    motoristas,
    isLoadingMotoristas,
    selectedCell,
    abrirModalMotoristas,
    fecharModalMotoristas
  } = useResumoDisponibilidade(dataInicio, dataFim);

  const handleExportarCSV = () => {
    if (!resumo) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const dados = prepararDadosResumo(
        resumo,
        datas.map(d => d.toISOString().split('T')[0]),
        periodoSelecionado === 'corrente' ? 'Semana Corrente' :
        periodoSelecionado === 'proxima' ? 'Próxima Semana' : 'Período Customizado'
      );
      
      const nomeArquivo = gerarNomeArquivo('resumo_disponibilidade');
      exportarCSV(dados, nomeArquivo);
      
      toast.success('Arquivo CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar arquivo CSV');
    }
  };

  const handleExportarExcel = () => {
    if (!resumo) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      const dados = prepararDadosResumo(
        resumo,
        datas.map(d => d.toISOString().split('T')[0]),
        periodoSelecionado === 'corrente' ? 'Semana Corrente' :
        periodoSelecionado === 'proxima' ? 'Próxima Semana' : 'Período Customizado'
      );
      
      const nomeArquivo = gerarNomeArquivo('resumo_disponibilidade');
      exportarExcel(dados, nomeArquivo);
      
      toast.success('Arquivo Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar arquivo Excel');
    }
  };

  const handleAtualizar = () => {
    refetch();
    toast.success('Dados atualizados!');
  };

  const formatarPeriodo = (): string => {
    const formatarData = (data: Date) => {
      return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return `${formatarData(datas[0])} a ${formatarData(datas[6])}`;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Resumo de Disponibilidade</h1>
          <p className="text-gray-600 mt-1">Visualização consolidada por turno e tipo de veículo</p>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="text-sm">
              <p className="font-semibold text-red-800">Erro ao carregar dados</p>
              <p className="text-red-700 mt-1">
                {(error as any)?.response?.data?.message || 'Erro desconhecido. Tente novamente.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Resumo de Disponibilidade</h1>
          <p className="text-gray-600 mt-1">
            Visualização consolidada por turno e tipo de veículo
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAtualizar}
            disabled={isLoading}
            className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleExportarCSV}
            disabled={isLoading || !resumo}
            className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            CSV
          </button>

          <button
            onClick={handleExportarExcel}
            disabled={isLoading || !resumo}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Filtros de período */}
      <FiltrosPeriodo
        periodoSelecionado={periodoSelecionado}
        onChangePeriodo={setPeriodoSelecionado}
        dataInicio={dataInicioCustom}
        dataFim={dataFimCustom}
        onChangeDataInicio={setDataInicioCustom}
        onChangeDataFim={setDataFimCustom}
      />

      {/* Info do período selecionado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">Período visualizado:</p>
              <p className="text-lg font-bold text-blue-900">{formatarPeriodo()}</p>
            </div>
          </div>
          
          {resumo && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Total de motoristas</p>
              <p className="text-3xl font-bold text-blue-600">
                {resumo.totalGeral.reduce((acc, val) => Math.max(acc, val), 0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de resumo */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      ) : resumo ? (
        <TabelaResumo
          resumo={resumo}
          datas={datas}
          onClickCelula={abrirModalMotoristas}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600">Nenhum dado disponível para o período selecionado</p>
        </div>
      )}

      {/* Modal de motoristas */}
      {selectedCell && (
        <ModalMotoristas
          isOpen={!!selectedCell}
          onClose={fecharModalMotoristas}
          motoristas={motoristas || []}
          isLoading={isLoadingMotoristas}
          data={selectedCell.data}
          turno={selectedCell.turno}
          tipoVeiculo={selectedCell.tipoVeiculo}
        />
      )}
    </div>
  );
}