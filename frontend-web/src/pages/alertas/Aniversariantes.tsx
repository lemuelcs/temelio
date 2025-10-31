import { useQuery } from '@tanstack/react-query';
import { Cake, Phone } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aniversariante {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  celular?: string | null;
  status: string;
  ehHoje: boolean;
}

interface AniversariantesData {
  totalDia: number;
  totalSemana: number;
  aniversariantes: Aniversariante[];
}

export default function Aniversariantes() {
  const { data, isLoading, error } = useQuery<AniversariantesData>({
    queryKey: ['aniversariantes'],
    queryFn: async () => {
      const response = await api.get('/motoristas/aniversariantes');
      return response.data?.data;
    },
  });

  const formatarWhatsApp = (celular: string | null | undefined) => {
    if (!celular) return null;
    const numero = celular.replace(/\D/g, '');
    return `https://wa.me/55${numero}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aniversariantes da Semana</h1>
          <p className="text-gray-600 mt-1">Confira os aniversariantes e envie suas felicitações</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando aniversariantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aniversariantes da Semana</h1>
          <p className="text-gray-600 mt-1">Confira os aniversariantes e envie suas felicitações</p>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
          <p className="text-red-700">Erro ao carregar aniversariantes</p>
        </div>
      </div>
    );
  }

  const aniversariantes = data?.aniversariantes || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aniversariantes da Semana</h1>
        <p className="text-gray-600 mt-1">Confira os aniversariantes e envie suas felicitações</p>
      </div>

      {aniversariantes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Cake className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum aniversariante esta semana</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motorista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Nascimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aniversariantes.map((aniversariante) => {
                  const whatsappUrl = formatarWhatsApp(aniversariante.celular);

                  return (
                    <tr
                      key={aniversariante.id}
                      className={
                        aniversariante.ehHoje
                          ? 'bg-yellow-50 border-l-4 border-yellow-400'
                          : ''
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Cake
                            className={`w-5 h-5 mr-3 ${
                              aniversariante.ehHoje ? 'text-yellow-500' : 'text-gray-400'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {aniversariante.nomeCompleto}
                            </div>
                            {aniversariante.ehHoje && (
                              <div className="text-xs text-yellow-600 font-semibold">
                                🎉 Aniversariante do dia!
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(aniversariante.dataNascimento), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            aniversariante.status === 'ATIVO'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {aniversariante.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-gray-400">Sem contato</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
