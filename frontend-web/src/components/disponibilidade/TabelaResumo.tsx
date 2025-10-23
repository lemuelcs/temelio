// frontend/src/components/disponibilidade/TabelaResumo.tsx
import { TurnoDisponibilidade, TipoVeiculo } from '../../types/disponibilidade';
import { getIconeTurno } from '../../utils/disponibilidade.utils';

interface ResumoTurno {
  [key: string]: number[];
  subtotal: number[];
}

interface TabelaResumoProps {
  resumo: {
    turnos: {
      [TurnoDisponibilidade.MATUTINO]: ResumoTurno;
      [TurnoDisponibilidade.VESPERTINO]: ResumoTurno;
      [TurnoDisponibilidade.NOTURNO]: ResumoTurno;
    };
    totalGeral: number[];
  };
  datas: Date[];
  onClickCelula: (data: string, turno: TurnoDisponibilidade, tipoVeiculo: TipoVeiculo) => void;
}

export function TabelaResumo({ resumo, datas, onClickCelula }: TabelaResumoProps) {
  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  const turnos = [
    { key: TurnoDisponibilidade.MATUTINO, label: 'MATUTINO', horario: '8h-12h' },
    { key: TurnoDisponibilidade.VESPERTINO, label: 'VESPERTINO', horario: '13h-17h' },
    { key: TurnoDisponibilidade.NOTURNO, label: 'NOTURNO', horario: '18h-22h' }
  ];

  const veiculos = [
    { key: TipoVeiculo.MOTOCICLETA, label: 'Motocicleta', icon: '🏍️' },
    { key: TipoVeiculo.CARRO_PASSEIO, label: 'Carro Passeio', icon: '🚗' },
    { key: TipoVeiculo.CARGO_VAN, label: 'Cargo Van', icon: '🚚' },
    { key: TipoVeiculo.LARGE_VAN, label: 'Large Van', icon: '🚛' }
  ];

  const formatarDia = (data: Date): string => {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const getCorDisponibilidade = (quantidade: number): string => {
    if (quantidade === 0) return 'bg-gray-100 text-gray-400';
    if (quantidade >= 1 && quantidade <= 4) return 'bg-red-100 text-red-700 hover:bg-red-200';
    if (quantidade >= 5 && quantidade <= 9) return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
    return 'bg-green-100 text-green-700 hover:bg-green-200';
  };

  const calcularTotal = (valores: number[]): number => {
    return valores.reduce((acc, val) => acc + val, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Cabeçalho */}
          <thead>
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="px-4 py-3 text-left font-semibold text-sm w-48 sticky left-0 bg-blue-600">
                Turno / Veículo
              </th>
              {diasSemana.map((dia, index) => (
                <th key={index} className="px-3 py-3 text-center font-semibold text-sm">
                  <div>{dia}</div>
                  <div className="text-xs font-normal text-blue-100">
                    {formatarDia(datas[index])}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-semibold text-sm">
                Total<br/>Semana
              </th>
            </tr>
          </thead>

          <tbody>
            {turnos.map((turno, turnoIndex) => (
              <React.Fragment key={turno.key}>
                {/* Header do turno */}
                <tr className="bg-gray-100 border-t-2 border-blue-500">
                  <td
                    colSpan={9}
                    className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getIconeTurno(turno.key)}</span>
                      <span>{turno.label}</span>
                      <span className="text-sm font-normal text-gray-600">
                        ({turno.horario})
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Linhas de veículos */}
                {veiculos.map(veiculo => {
                  const valores = resumo.turnos[turno.key][veiculo.key];
                  const total = calcularTotal(valores);

                  return (
                    <tr
                      key={`${turno.key}-${veiculo.key}`}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 sticky left-0 bg-white">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{veiculo.icon}</span>
                          <span>{veiculo.label}</span>
                        </div>
                      </td>
                      {valores.map((quantidade, diaIndex) => (
                        <td
                          key={diaIndex}
                          className="px-3 py-3 text-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              quantidade > 0 &&
                              onClickCelula(
                                datas[diaIndex].toISOString().split('T')[0],
                                turno.key,
                                veiculo.key
                              )
                            }
                            disabled={quantidade === 0}
                            className={`
                              w-full px-3 py-2 rounded-lg font-semibold text-sm transition-all
                              ${getCorDisponibilidade(quantidade)}
                              ${quantidade > 0 ? 'cursor-pointer shadow-sm hover:shadow-md' : 'cursor-default'}
                            `}
                          >
                            {quantidade}
                          </button>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">
                        {total}
                      </td>
                    </tr>
                  );
                })}

                {/* Subtotal do turno */}
                <tr className="bg-blue-50 border-b border-blue-200">
                  <td className="px-4 py-3 font-semibold text-gray-900 sticky left-0 bg-blue-50">
                    Subtotal
                  </td>
                  {resumo.turnos[turno.key].subtotal.map((valor, index) => (
                    <td
                      key={index}
                      className="px-3 py-3 text-center font-bold text-blue-700"
                    >
                      {valor}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold text-blue-700">
                    {calcularTotal(resumo.turnos[turno.key].subtotal)}
                  </td>
                </tr>

                {/* Espaçamento entre turnos (exceto último) */}
                {turnoIndex < turnos.length - 1 && (
                  <tr className="h-2 bg-gray-50"></tr>
                )}
              </React.Fragment>
            ))}

            {/* Total geral */}
            <tr className="bg-gradient-to-r from-blue-100 to-blue-200 border-t-2 border-blue-600 border-b-2">
              <td className="px-4 py-4 font-bold text-gray-900 sticky left-0 bg-blue-100">
                📊 TOTAL GERAL
              </td>
              {resumo.totalGeral.map((valor, index) => (
                <td
                  key={index}
                  className="px-3 py-4 text-center font-bold text-blue-900 text-lg"
                >
                  {valor}
                </td>
              ))}
              <td className="px-4 py-4 text-center font-bold text-blue-900 text-lg">
                {calcularTotal(resumo.totalGeral)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">
          💡 Legenda de Cores:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center">
              <span className="text-green-700 font-bold text-xs">10+</span>
            </div>
            <span className="text-sm text-gray-700">Alta disponibilidade</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-300 rounded flex items-center justify-center">
              <span className="text-yellow-700 font-bold text-xs">5-9</span>
            </div>
            <span className="text-sm text-gray-700">Moderada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center">
              <span className="text-red-700 font-bold text-xs">1-4</span>
            </div>
            <span className="text-sm text-gray-700">Baixa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center">
              <span className="text-gray-400 font-bold text-xs">0</span>
            </div>
            <span className="text-sm text-gray-700">Nenhum</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          📌 Clique em qualquer célula com valor para ver a lista de motoristas disponíveis
        </p>
      </div>
    </div>
  );
}

// Importar React se não estiver no arquivo
import React from 'react';