// frontend/src/components/disponibilidade/ModalMotoristas.tsx
import { X, Phone, MapPin, Award } from 'lucide-react';
import { CicloRota, TipoVeiculo } from '../../types/disponibilidade';
import { getIconeCiclo, getTituloCiclo, getDescricaoCiclo, formatarDiaMes } from '../../utils/disponibilidade.utils';

interface Motorista {
  id: string;
  nomeCompleto: string;
  celular: string;
  cidade: string;
  uf: string;
  tipoVeiculo: TipoVeiculo;
  pontuacao: number;
  nivel: string;
  usuario: {
    email: string;
  };
}

interface ModalMotoristasProps {
  isOpen: boolean;
  onClose: () => void;
  motoristas: Motorista[];
  isLoading: boolean;
  data: string;
  ciclo: CicloRota;
  tipoVeiculo: TipoVeiculo;
}

export function ModalMotoristas({
  isOpen,
  onClose,
  motoristas,
  isLoading,
  data,
  ciclo,
  tipoVeiculo
}: ModalMotoristasProps) {
  if (!isOpen) return null;

  const formatarCelular = (celular: string): string => {
    if (celular.length === 11) {
      return `(${celular.substring(0, 2)}) ${celular.substring(2, 7)}-${celular.substring(7)}`;
    }
    return celular;
  };

  const getIconeVeiculo = (tipo: TipoVeiculo): string => {
    const icones = {
      MOTOCICLETA: '🏍️',
      CARRO_PASSEIO: '🚗',
      CARGO_VAN: '🚚',
      LARGE_VAN: '🚛'
    };
    return icones[tipo] || '🚗';
  };

  const getLabelVeiculo = (tipo: TipoVeiculo): string => {
    const labels = {
      MOTOCICLETA: 'Motocicleta',
      CARRO_PASSEIO: 'Carro Passeio',
      CARGO_VAN: 'Cargo Van',
      LARGE_VAN: 'Large Van'
    };
    return labels[tipo] || tipo;
  };

  const getCorNivel = (nivel: string): string => {
    const cores: { [key: string]: string } = {
      ELITE: 'bg-purple-100 text-purple-700 border-purple-300',
      OURO: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      PRATA: 'bg-gray-100 text-gray-700 border-gray-300',
      BRONZE: 'bg-orange-100 text-orange-700 border-orange-300',
      INICIANTE: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return cores[nivel] || 'bg-gray-100 text-gray-700';
  };

  const getIconeNivel = (nivel: string): string => {
    const icones: { [key: string]: string } = {
      ELITE: '🏆',
      OURO: '🥇',
      PRATA: '🥈',
      BRONZE: '🥉',
      INICIANTE: '🌱'
    };
    return icones[nivel] || '⭐';
  };

  // Agrupar motoristas por nível
  const motoristasPorNivel = motoristas.reduce((acc, motorista) => {
    const nivel = motorista.nivel || 'INICIANTE';
    if (!acc[nivel]) acc[nivel] = [];
    acc[nivel].push(motorista);
    return acc;
  }, {} as { [key: string]: Motorista[] });

  const ordenacaoNiveis = ['ELITE', 'OURO', 'PRATA', 'BRONZE', 'INICIANTE'];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">
                  Motoristas Disponíveis
                </h2>
                <div className="flex items-center gap-3 text-blue-100 text-sm">
                  <span>{getIconeVeiculo(tipoVeiculo)} {getLabelVeiculo(tipoVeiculo)}</span>
                  <span>•</span>
                  <span>{getIconeCiclo(ciclo)} {getTituloCiclo(ciclo)}</span>
                  <span>•</span>
                  <span>{getDescricaoCiclo(ciclo)}</span>
                  <span>•</span>
                  <span>{formatarDiaMes(new Date(data))}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-500 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : motoristas.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  Nenhum motorista disponível para este período
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Total */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-medium text-gray-700">
                    Total de motoristas disponíveis:{' '}
                    <span className="text-xl font-bold text-blue-600">
                      {motoristas.length}
                    </span>
                  </p>
                </div>

                {/* Motoristas agrupados por nível */}
                {ordenacaoNiveis.map(nivel => {
                  const motoristasDessevel = motoristasPorNivel[nivel];
                  if (!motoristasDessevel || motoristasDessevel.length === 0) return null;

                  return (
                    <div key={nivel}>
                      {/* Header do nível */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{getIconeNivel(nivel)}</span>
                        <h3 className="text-lg font-bold text-gray-900">
                          {nivel}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({motoristasDessevel.length})
                        </span>
                      </div>

                      {/* Lista de motoristas */}
                      <div className="space-y-3 mb-6">
                        {motoristasDessevel.map(motorista => (
                          <div
                            key={motorista.id}
                            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {motorista.nomeCompleto}
                                  </h4>
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getCorNivel(nivel)}`}>
                                    {nivel}
                                  </span>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{motorista.cidade}-{motorista.uf}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{formatarCelular(motorista.celular)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="flex items-center gap-1 text-yellow-600 font-bold">
                                  <Award className="w-4 h-4" />
                                  <span>{motorista.pontuacao}</span>
                                </div>
                                <p className="text-xs text-gray-500">pontos</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
