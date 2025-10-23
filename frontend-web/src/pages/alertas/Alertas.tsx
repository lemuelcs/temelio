// frontend/src/pages/alertas/Alertas.tsx
// CORRIGIDO: Tratamento de erro 403 e fallback de dados

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, FileText, User, Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Alerta {
  motorista: {
    id: string;
    nome: string;
    cpf: string;
    email: string;
    tipoVeiculo: string;
  };
  documentos: {
    cnh: {
      numero: string;
      validade: string;
      diasParaVencimento: number;
      status: 'VALIDO' | 'VENCENDO' | 'VENCIDO';
    };
    brk?: {
      numero: string;
      validade: string;
      diasParaVencimento: number;
      status: 'VALIDO' | 'VENCENDO' | 'VENCIDO';
    };
    crlv?: {
      validade: string;
      diasParaVencimento: number;
      status: 'VALIDO' | 'VENCENDO' | 'VENCIDO';
    };
  };
  elegibilidade: {
    elegivel: boolean;
    motivo?: string;
  };
}

export default function Alertas() {
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');

  // Buscar alertas de compliance
  const { data: alertas = [], isLoading, error, refetch } = useQuery({
    queryKey: ['alertas-compliance'],
    queryFn: async () => {
      try {
        // Buscar motoristas do endpoint de gestão
        const response = await api.get('/gestao/motoristas');
        
        // Tratar diferentes estruturas de resposta da API
        const motoristas = response.data?.data?.motoristas || 
                          response.data?.motoristas || 
                          response.data || 
                          [];
        
        const dados = Array.isArray(motoristas) ? motoristas : [];
        
        // Se não houver motoristas, retornar array vazio
        if (dados.length === 0) {
          console.warn('Nenhum motorista encontrado para gerar alertas');
          return [];
        }
        
        // Processar motoristas para gerar alertas
        return dados.map((m: any) => {
          const hoje = new Date();
          const doc = m.documentos?.[0] || m.documento || {};
          
          const calcularStatus = (validade: string | null | undefined): 'VALIDO' | 'VENCENDO' | 'VENCIDO' => {
            if (!validade) return 'VALIDO';
            try {
              const dias = differenceInDays(new Date(validade), hoje);
              if (dias < 0) return 'VENCIDO';
              if (dias <= 30) return 'VENCENDO';
              return 'VALIDO';
            } catch {
              return 'VALIDO';
            }
          };

          return {
            motorista: {
              id: m.id || m._id || '',
              nome: m.nomeCompleto || m.nome || 'Nome não disponível',
              cpf: m.cpf || 'N/A',
              email: m.email || 'N/A',
              tipoVeiculo: m.tipoVeiculo || 'N/A',
            },
            documentos: {
              cnh: {
                numero: doc.numeroCNH || doc.cnhNumero || 'N/A',
                validade: doc.validadeCNH || doc.cnhValidade || new Date().toISOString(),
                diasParaVencimento: (doc.validadeCNH || doc.cnhValidade) ? 
                  differenceInDays(new Date(doc.validadeCNH || doc.cnhValidade), hoje) : 999,
                status: calcularStatus(doc.validadeCNH || doc.cnhValidade),
              },
              ...((doc.proximaVerificacaoBRK || doc.brkValidade) && {
                brk: {
                  numero: doc.numeroBRK || doc.brkNumero || 'N/A',
                  validade: doc.proximaVerificacaoBRK || doc.brkValidade || '',
                  diasParaVencimento: differenceInDays(
                    new Date(doc.proximaVerificacaoBRK || doc.brkValidade), 
                    hoje
                  ),
                  status: calcularStatus(doc.proximaVerificacaoBRK || doc.brkValidade),
                },
              }),
              ...((doc.anoLicenciamento || m.crlvValidade) && {
                crlv: {
                  validade: doc.anoLicenciamento ? `${doc.anoLicenciamento}-12-31` : m.crlvValidade,
                  diasParaVencimento: doc.anoLicenciamento ? 
                    differenceInDays(new Date(`${doc.anoLicenciamento}-12-31`), hoje) :
                    (m.crlvValidade ? differenceInDays(new Date(m.crlvValidade), hoje) : 999),
                  status: calcularStatus(doc.anoLicenciamento ? `${doc.anoLicenciamento}-12-31` : m.crlvValidade),
                },
              }),
            },
            elegibilidade: {
              elegivel: m.status === 'ATIVO' && doc.statusBRK === true,
              motivo: m.status !== 'ATIVO' ? 'Motorista inativo' : 
                      !doc.statusBRK ? 'BRK não válido' : undefined,
            },
          };
        });
      } catch (error: any) {
        console.error('Erro ao buscar alertas:', error);
        
        // Se for erro 403, pode ser falta de permissão
        if (error.response?.status === 403) {
          throw new Error('Você não tem permissão para visualizar os alertas de compliance. Entre em contato com o administrador.');
        }
        
        // Para outros erros, retornar array vazio ao invés de falhar
        return [];
      }
    },
    // Adicionar retry e configurações de erro
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Filtrar alertas
  const filteredAlertas = alertas.filter((a: Alerta) => {
    const temProblema = !a.elegibilidade.elegivel ||
                       a.documentos.cnh.status !== 'VALIDO' ||
                       (a.documentos.brk && a.documentos.brk.status !== 'VALIDO') ||
                       (a.documentos.crlv && a.documentos.crlv.status !== 'VALIDO');

    const matchesStatus = !filterStatus || 
      (filterStatus === 'CRITICO' && !a.elegibilidade.elegivel) ||
      (filterStatus === 'ATENCAO' && temProblema);

    const matchesTipo = !filterTipo || a.motorista.tipoVeiculo === filterTipo;

    return matchesStatus && matchesTipo;
  });

  // Estatísticas
  const stats = {
    total: alertas.length,
    naoElegiveis: alertas.filter((a: Alerta) => !a.elegibilidade.elegivel).length,
    cnhVencendo: alertas.filter((a: Alerta) => a.documentos.cnh.status === 'VENCENDO').length,
    cnhVencida: alertas.filter((a: Alerta) => a.documentos.cnh.status === 'VENCIDO').length,
    brkVencendo: alertas.filter((a: Alerta) => a.documentos.brk?.status === 'VENCENDO').length,
    crlvVencendo: alertas.filter((a: Alerta) => a.documentos.crlv?.status === 'VENCENDO').length,
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      VALIDO: 'bg-green-100 text-green-800',
      VENCENDO: 'bg-yellow-100 text-yellow-800',
      VENCIDO: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.VALIDO;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'VALIDO') return <CheckCircle className="w-4 h-4" />;
    if (status === 'VENCENDO') return <Clock className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  // Renderizar erro de permissão
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas de Compliance</h1>
          <p className="text-gray-600 mt-1">Monitore documentos e elegibilidade dos motoristas</p>
        </div>

        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-lg mb-2">Erro ao carregar dados</p>
              <p className="text-red-700 mb-4">
                {(error as any)?.message || 'Erro desconhecido ao buscar alertas'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Possíveis causas:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 ml-4 space-y-1">
            <li>• Você pode não ter permissão para acessar a lista de motoristas</li>
            <li>• Seu token de autenticação pode ter expirado - tente fazer logout e login novamente</li>
            <li>• O backend pode estar temporariamente indisponível</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas de Compliance</h1>
        <p className="text-gray-600 mt-1">Monitore documentos e elegibilidade dos motoristas</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Motoristas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <User className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Não Elegíveis</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.naoElegiveis}</p>
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
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.brkVencendo + stats.crlvVencendo}
              </p>
            </div>
            <FileText className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="CRITICO">Críticos (Não Elegíveis)</option>
            <option value="ATENCAO">Requerem Atenção</option>
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os veículos</option>
            <option value="MOTOCICLETA">Motocicleta</option>
            <option value="CARRO_PASSEIO">Carro de Passeio</option>
            <option value="CARGO_VAN">Van Carga</option>
            <option value="LARGE_VAN">Van Grande</option>
          </select>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando alertas...</p>
          </div>
        ) : filteredAlertas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">
              {alertas.length === 0 
                ? 'Nenhum motorista cadastrado ainda'
                : 'Nenhum alerta encontrado com os filtros aplicados'}
            </p>
          </div>
        ) : (
          filteredAlertas.map((alerta: Alerta) => (
            <div
              key={alerta.motorista.id}
              className={`bg-white rounded-lg shadow p-6 ${
                !alerta.elegibilidade.elegivel ? 'border-l-4 border-red-500' : ''
              }`}
            >
              {/* Cabeçalho do Motorista */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <User className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {alerta.motorista.nome}
                    </h3>
                    <p className="text-sm text-gray-600">{alerta.motorista.email}</p>
                    <p className="text-sm text-gray-500">
                      {alerta.motorista.tipoVeiculo} • CPF: {alerta.motorista.cpf}
                    </p>
                  </div>
                </div>

                {!alerta.elegibilidade.elegivel && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Não Elegível</span>
                  </div>
                )}
              </div>

              {/* Motivo de Inelegibilidade */}
              {!alerta.elegibilidade.elegivel && alerta.elegibilidade.motivo && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Motivo:</strong> {alerta.elegibilidade.motivo}
                  </p>
                </div>
              )}

              {/* Documentos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CNH */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">CNH</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(alerta.documentos.cnh.status)}`}>
                      {getStatusIcon(alerta.documentos.cnh.status)}
                      {alerta.documentos.cnh.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <strong>Número:</strong> {alerta.documentos.cnh.numero}
                    </p>
                    {alerta.documentos.cnh.validade && (
                      <>
                        <p className="text-gray-600">
                          <strong>Validade:</strong> {format(new Date(alerta.documentos.cnh.validade), 'dd/MM/yyyy')}
                        </p>
                        <p className={`font-medium ${
                          alerta.documentos.cnh.diasParaVencimento < 0 ? 'text-red-600' :
                          alerta.documentos.cnh.diasParaVencimento <= 30 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {alerta.documentos.cnh.diasParaVencimento < 0
                            ? `Vencida há ${Math.abs(alerta.documentos.cnh.diasParaVencimento)} dias`
                            : `Vence em ${alerta.documentos.cnh.diasParaVencimento} dias`}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* BRK */}
                {alerta.documentos.brk && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">BRK</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(alerta.documentos.brk.status)}`}>
                        {getStatusIcon(alerta.documentos.brk.status)}
                        {alerta.documentos.brk.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <strong>Número:</strong> {alerta.documentos.brk.numero}
                      </p>
                      <p className="text-gray-600">
                        <strong>Validade:</strong> {format(new Date(alerta.documentos.brk.validade), 'dd/MM/yyyy')}
                      </p>
                      <p className={`font-medium ${
                        alerta.documentos.brk.diasParaVencimento < 0 ? 'text-red-600' :
                        alerta.documentos.brk.diasParaVencimento <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {alerta.documentos.brk.diasParaVencimento < 0
                          ? `Vencida há ${Math.abs(alerta.documentos.brk.diasParaVencimento)} dias`
                          : `Vence em ${alerta.documentos.brk.diasParaVencimento} dias`}
                      </p>
                    </div>
                  </div>
                )}

                {/* CRLV */}
                {alerta.documentos.crlv && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">CRLV</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(alerta.documentos.crlv.status)}`}>
                        {getStatusIcon(alerta.documentos.crlv.status)}
                        {alerta.documentos.crlv.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <strong>Validade:</strong> {format(new Date(alerta.documentos.crlv.validade), 'dd/MM/yyyy')}
                      </p>
                      <p className={`font-medium ${
                        alerta.documentos.crlv.diasParaVencimento < 0 ? 'text-red-600' :
                        alerta.documentos.crlv.diasParaVencimento <= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {alerta.documentos.crlv.diasParaVencimento < 0
                          ? `Vencida há ${Math.abs(alerta.documentos.crlv.diasParaVencimento)} dias`
                          : `Vence em ${alerta.documentos.crlv.diasParaVencimento} dias`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}