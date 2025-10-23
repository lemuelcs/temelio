// frontend/src/components/disponibilidade/FiltrosPeriodo.tsx
import { Calendar } from 'lucide-react';
import { getInicioSemana, getFimSemana, formatarDiaMes } from '../../utils/disponibilidade.utils';

interface FiltrosPeriodoProps {
  periodoSelecionado: 'corrente' | 'proxima' | 'customizado';
  onChangePeriodo: (periodo: 'corrente' | 'proxima' | 'customizado') => void;
  dataInicio?: string;
  dataFim?: string;
  onChangeDataInicio?: (data: string) => void;
  onChangeDataFim?: (data: string) => void;
}

export function FiltrosPeriodo({
  periodoSelecionado,
  onChangePeriodo,
  dataInicio,
  dataFim,
  onChangeDataInicio,
  onChangeDataFim
}: FiltrosPeriodoProps) {
  const hoje = new Date();
  const inicioSemanaCorrente = getInicioSemana(hoje);
  const fimSemanaCorrente = getFimSemana(hoje);
  
  const inicioProximaSemana = new Date(fimSemanaCorrente);
  inicioProximaSemana.setDate(inicioProximaSemana.getDate() + 1);
  const fimProximaSemana = getFimSemana(inicioProximaSemana);

  const formatarData = (data: Date): string => {
    return data.toISOString().split('T')[0];
  };

  const formatarRangeExibicao = (inicio: Date, fim: Date): string => {
    return `${formatarDiaMes(inicio)} a ${formatarDiaMes(fim)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Período</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Semana Corrente */}
        <button
          type="button"
          onClick={() => onChangePeriodo('corrente')}
          className={`
            p-4 rounded-lg border-2 transition-all text-left
            ${periodoSelecionado === 'corrente'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 bg-white'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">Semana Corrente</span>
            {periodoSelecionado === 'corrente' && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {formatarRangeExibicao(inicioSemanaCorrente, fimSemanaCorrente)}
          </p>
        </button>

        {/* Próxima Semana */}
        <button
          type="button"
          onClick={() => onChangePeriodo('proxima')}
          className={`
            p-4 rounded-lg border-2 transition-all text-left
            ${periodoSelecionado === 'proxima'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 bg-white'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">Próxima Semana</span>
            {periodoSelecionado === 'proxima' && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {formatarRangeExibicao(inicioProximaSemana, fimProximaSemana)}
          </p>
        </button>

        {/* Período Customizado */}
        <button
          type="button"
          onClick={() => onChangePeriodo('customizado')}
          className={`
            p-4 rounded-lg border-2 transition-all text-left
            ${periodoSelecionado === 'customizado'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 bg-white'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">Customizado</span>
            {periodoSelecionado === 'customizado' && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <p className="text-sm text-gray-600">Escolher datas</p>
        </button>
      </div>

      {/* Inputs customizados (só aparecem quando selecionado) */}
      {periodoSelecionado === 'customizado' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Selecione o período desejado (7 dias):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início (Domingo)
              </label>
              <input
                type="date"
                value={dataInicio || ''}
                onChange={(e) => onChangeDataInicio?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim (Sábado)
              </label>
              <input
                type="date"
                value={dataFim || ''}
                onChange={(e) => onChangeDataFim?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            💡 Dica: Selecione sempre de domingo a sábado para melhor visualização
          </p>
        </div>
      )}
    </div>
  );
}