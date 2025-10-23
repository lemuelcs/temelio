// frontend/src/pages/motorista/Disponibilidade.tsx
// CORRIGIDO: Removida obrigatoriedade de preencher 42 turnos
// Motorista pode salvar parcialmente, respeitando autonomia MEI

import { useEffect, useState } from 'react';
import { Save, RefreshCw, Clock, AlertCircle, CheckCircle, History, Info } from 'lucide-react';
import { CalendarioDisponibilidade } from '../../components/disponibilidade/CalendarioDisponibilidade';
import { useDisponibilidade, useCalendarioDisponibilidade } from '../../hooks/useDisponibilidade';
import { getSemanaCorrenteEProxima } from '../../utils/disponibilidade.utils';
import { toast } from 'react-hot-toast';

export default function DisponibilidadeMotorista() {
  const { semanas, isLoadingSemanas, salvar, isSaving } = useDisponibilidade();
  const {
    isDisponivel,
    toggleDisponibilidade,
    carregarDisponibilidades,
    getTotalSelecionado,
    converterParaEnvio,
    temAlteracoes,
    limparAlteracoes
  } = useCalendarioDisponibilidade();

  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [ultimaAlteracao, setUltimaAlteracao] = useState<string | null>(null);

  const { semanaCorrente, proximaSemana } = getSemanaCorrenteEProxima();

  // Carregar disponibilidades existentes quando os dados chegarem
  useEffect(() => {
    console.log('🎯 useEffect disparado, semanas:', semanas);
    if (semanas) {
      const todasDisponibilidades = [
        ...semanas.semanaCorrente.disponibilidades,
        ...semanas.proximaSemana.disponibilidades
      ];
    
      console.log('📦 Total de disponibilidades:', todasDisponibilidades.length);
      console.log('📋 Disponibilidades:', todasDisponibilidades);
      
      carregarDisponibilidades(todasDisponibilidades);

      // Pegar a data da última alteração
      if (todasDisponibilidades.length > 0) {
        const maisRecente = todasDisponibilidades.reduce((a, b) =>
          new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
        );
        setUltimaAlteracao(maisRecente.updatedAt);
      }
    }
  }, [semanas]);

  const handleSalvar = async () => {
    try {
      const disponibilidades = converterParaEnvio();
      
      // ✅ REMOVIDO: Validação de 42 turnos obrigatórios
      // Motorista MEI tem autonomia para informar apenas quando está disponível
      
      // Validação mínima: pelo menos 1 turno deve ser preenchido
      if (disponibilidades.length === 0) {
        toast.error('Selecione pelo menos um turno para salvar');
        return;
      }

      await salvar(disponibilidades);
      
      limparAlteracoes();
      setUltimaAlteracao(new Date().toISOString());
      
      toast.success(`Disponibilidade salva! ${disponibilidades.length} turno(s) atualizado(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar disponibilidade');
    }
  };

  const handleResetar = () => {
    if (confirm('Tem certeza que deseja resetar suas seleções? Esta ação não pode ser desfeita.')) {
      limparAlteracoes();
      toast.success('Seleções resetadas');
    }
  };

  const totalSelecionado = getTotalSelecionado();
  const percentualPreenchido = ((totalSelecionado / 42) * 100).toFixed(0);

  if (isLoadingSemanas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando disponibilidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Minha Disponibilidade
        </h1>
        <p className="text-gray-600">
          Informe sua disponibilidade para as próximas 2 semanas. Você pode atualizar a qualquer momento.
        </p>
      </div>

      {/* Card de Informações e Ações */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Estatísticas */}
          <div className="flex flex-wrap gap-6">
            {/* Turnos Preenchidos */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Turnos Disponíveis</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSelecionado} <span className="text-sm font-normal text-gray-500">/ 42</span>
                </p>
                <p className="text-xs text-gray-500">{percentualPreenchido}% preenchido</p>
              </div>
            </div>

            {/* Última Alteração */}
            {ultimaAlteracao && (
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Atualização</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(ultimaAlteracao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetar}
              disabled={!temAlteracoes() || isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Resetar
            </button>

            <button
              onClick={handleSalvar}
              disabled={!temAlteracoes() || isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Disponibilidade
                </>
              )}
            </button>
          </div>
        </div>

        {/* Aviso de Alterações Pendentes */}
        {temAlteracoes() && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Você tem alterações não salvas
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Clique em "Salvar Disponibilidade" para confirmar suas mudanças
              </p>
            </div>
          </div>
        )}

        {/* Informativo sobre autonomia MEI */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Você tem autonomia para definir sua disponibilidade
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Como motorista parceiro (MEI), você informa quando está disponível de acordo com sua realidade. 
              Não é obrigatório preencher todos os turnos. O sistema sempre mostrará as próximas 2 semanas para você atualizar quando desejar.
            </p>
          </div>
        </div>
      </div>

      {/* Calendários */}
      <div className="space-y-8">
        {/* Semana Corrente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Semana Corrente
            </h2>
            <p className="text-sm text-gray-600">
              {semanaCorrente.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {' '}
              {semanaCorrente.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <CalendarioDisponibilidade
            dataInicio={semanaCorrente.inicio}
            dataFim={semanaCorrente.fim}
            onToggle={toggleDisponibilidade}
            isDisponivel={isDisponivel}
          />
        </div>

        {/* Próxima Semana */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Próxima Semana
            </h2>
            <p className="text-sm text-gray-600">
              {proximaSemana.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {' '}
              {proximaSemana.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <CalendarioDisponibilidade
            dataInicio={proximaSemana.inicio}
            dataFim={proximaSemana.fim}
            onToggle={toggleDisponibilidade}
            isDisponivel={isDisponivel}
          />
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legenda:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
            <span className="text-sm text-gray-700">Disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
            <span className="text-sm text-gray-700">Indisponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span className="text-sm text-gray-700">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded opacity-50"></div>
            <span className="text-sm text-gray-700">Data passada</span>
          </div>
        </div>
      </div>

      {/* Dicas */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Dicas para gerenciar sua disponibilidade:
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Você pode atualizar sua disponibilidade a qualquer momento</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Informe apenas os turnos em que você está realmente disponível</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Quanto mais antecedência você informar, melhor para o planejamento das rotas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Disponibilidade informada não é compromisso de trabalho - você mantém autonomia para aceitar ou recusar rotas</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
