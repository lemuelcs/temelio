// frontend/src/components/disponibilidade/CalendarioDisponibilidade.tsx
// CORRIGIDO: Labels dos ciclos em formato hierárquico

import { eachDayOfInterval, format, isSameDay, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CicloRota } from '../../types/disponibilidade';

interface CalendarioDisponibilidadeProps {
  dataInicio: Date;
  dataFim: Date;
  onToggle: (data: Date, ciclo: CicloRota) => void;
  isDisponivel: (data: Date, ciclo: CicloRota) => boolean;
}

const CICLOS = [
  { 
    value: CicloRota.CICLO_1, 
    titulo: 'Ciclo 1',
    subtitulo: 'Manhã/Tarde (7h-17h)',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300' 
  },
  { 
    value: CicloRota.CICLO_2, 
    titulo: 'Ciclo 2',
    subtitulo: 'Tarde (12h-20h)',
    color: 'bg-orange-100 text-orange-800 border-orange-300' 
  },
  { 
    value: CicloRota.SAME_DAY, 
    titulo: 'Same Day',
    subtitulo: 'Noite (18h-23h)',
    color: 'bg-purple-100 text-purple-800 border-purple-300' 
  }
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarioDisponibilidade({
  dataInicio,
  dataFim,
  onToggle,
  isDisponivel
}: CalendarioDisponibilidadeProps) {

  // Validação de segurança
  if (!dataInicio || !dataFim) {
    console.warn('CalendarioDisponibilidade: datas não fornecidas');
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        <p>Aguardando carregamento das datas...</p>
      </div>
    );
  }

  // Gerar array de dias do intervalo com validação
  let dias: Date[] = [];
  try {
    dias = eachDayOfInterval({ start: dataInicio, end: dataFim });
  } catch (error) {
    console.error('Erro ao gerar intervalo de dias:', error);
    return (
      <div className="p-4 bg-red-50 rounded-lg text-center text-red-600">
        <p>Erro ao carregar calendário. Por favor, recarregue a página.</p>
      </div>
    );
  }

  // Validação adicional
  if (!dias || dias.length === 0) {
    console.warn('CalendarioDisponibilidade: nenhum dia gerado');
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        <p>Nenhuma data disponível para exibição.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200">
              Ciclo
            </th>
            {dias.map((dia, index) => {
              const ePassado = isPast(dia) && !isToday(dia);
              const eHoje = isToday(dia);
              
              return (
                <th
                  key={index}
                  className={`p-2 text-center text-sm font-medium border border-gray-200 ${
                    eHoje
                      ? 'bg-blue-100 text-blue-900'
                      : ePassado
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs uppercase">
                      {DIAS_SEMANA[dia.getDay()]}
                    </span>
                    <span className="text-lg font-bold">
                      {format(dia, 'd', { locale: ptBR })}
                    </span>
                    <span className="text-xs">
                      {format(dia, 'MMM', { locale: ptBR })}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {CICLOS.map((ciclo) => (
            <tr key={ciclo.value}>
              {/* Coluna do Ciclo - Formato Hierárquico */}
              <td className={`p-3 border border-gray-200 ${ciclo.color}`}>
                <div className="flex flex-col">
                  <span className="font-bold text-base">{ciclo.titulo}</span>
                  <span className="text-xs mt-0.5 opacity-80">{ciclo.subtitulo}</span>
                </div>
              </td>

              {/* Células de Disponibilidade */}
              {dias.map((dia, index) => {
                const ePassado = isPast(dia) && !isToday(dia);
                const disponivel = isDisponivel(dia, ciclo.value);
                const eHoje = isToday(dia);

                return (
                  <td
                    key={index}
                    className={`p-1 border border-gray-200 ${
                      eHoje ? 'bg-blue-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => !ePassado && onToggle(dia, ciclo.value)}
                      disabled={ePassado}
                      className={`
                        w-full h-12 rounded-md border-2 transition-all
                        ${ePassado
                          ? 'cursor-not-allowed bg-gray-100 border-gray-300 opacity-40'
                          : disponivel
                          ? 'bg-green-500 border-green-600 hover:bg-green-600 cursor-pointer shadow-sm'
                          : 'bg-white border-gray-300 hover:bg-gray-50 cursor-pointer'
                        }
                        ${!ePassado && 'active:scale-95'}
                      `}
                      aria-label={`${disponivel ? 'Disponível' : 'Indisponível'} - ${format(dia, 'dd/MM')} - ${ciclo.titulo}`}
                    >
                      {disponivel && !ePassado && (
                        <svg
                          className="w-6 h-6 mx-auto text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
