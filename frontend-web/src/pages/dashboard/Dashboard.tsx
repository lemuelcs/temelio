// src/pages/dashboard/Dashboard.tsx - VERSÃO CORRIGIDA
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
  Users,
  Truck,
  CheckCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  motoristas: {
    total: number;
    ativos: number;
    inativos: number;
    onboarding: number;
  };
  rotas: {
    total: number;
    criadas: number;
    ofertadas: number;
    aceitas: number;
    recusadas: number;
    confirmadas: number;
    validadas: number;
    pendentes: number; // NOVO: rotas que precisam de atenção
  };
  rotasHoje: {
    total: number;
    alocadas: number;
    aceitas: number;
  };
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de gestão de última milha</p>
      </div>

      {/* ALERTA DE ROTAS PENDENTES - EM DESTAQUE */}
      {stats && stats.rotas.pendentes > 0 && (
        <Link to="/rotas/alocar">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-4 border-red-400 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-1">
                    ⚠️ Rotas Precisam de Atenção!
                  </h3>
                  <p className="text-red-100 text-sm">
                    Há rotas criadas aguardando alocação ou resposta de motoristas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-white mb-1">
                  {stats.rotas.pendentes}
                </div>
                <div className="text-red-100 text-sm font-semibold">
                  ROTAS PENDENTES
                </div>
                <div className="mt-3 px-4 py-2 bg-white text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors">
                  Ir para Alocação →
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Motoristas Ativos */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.motoristas.ativos || 0}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Motoristas Ativos</h3>
          <p className="text-xs text-gray-500 mt-1">
            De {stats?.motoristas.total || 0} cadastrados
          </p>
        </div>

        {/* Rotas Hoje - Alocadas e Aceitas */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.rotasHoje.aceitas || 0}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Rotas Aceitas Hoje</h3>
          <p className="text-xs text-gray-500 mt-1">
            De {stats?.rotasHoje.alocadas || 0} alocadas
          </p>
        </div>

        {/* Total de Rotas */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.rotas.total || 0}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Total de Rotas</h3>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.rotas.criadas || 0} criadas | {stats?.rotas.aceitas || 0} aceitas
          </p>
        </div>

        {/* Em Onboarding */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.motoristas.onboarding || 0}
            </span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Em Onboarding</h3>
          <p className="text-xs text-gray-500 mt-1">
            Motoristas em processo de integração
          </p>
        </div>
      </div>

      {/* Detalhamento de Rotas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status das Rotas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Status das Rotas
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Criadas (não alocadas)</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                {stats?.rotas.criadas || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Ofertadas (aguardando resposta)</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {stats?.rotas.ofertadas || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Aceitas</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                {stats?.rotas.aceitas || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Recusadas</span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {stats?.rotas.recusadas || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Confirmadas</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                {stats?.rotas.confirmadas || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Validadas</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                {stats?.rotas.validadas || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Status dos Motoristas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Status dos Motoristas
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Ativos</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                {stats?.motoristas.ativos || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Em Onboarding</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                {stats?.motoristas.onboarding || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Inativos</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                {stats?.motoristas.inativos || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Cadastrados</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {stats?.motoristas.total || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/motoristas"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Gerenciar Motoristas</h4>
            <p className="text-sm text-gray-600">Cadastrar e gerenciar motoristas</p>
          </Link>

          <Link
            to="/rotas/alocar"
            className="p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <Truck className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Alocar Rotas</h4>
            <p className="text-sm text-gray-600">Alocar motoristas às rotas (D-1)</p>
          </Link>

          <Link
            to="/rotas/confirmar"
            className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <CheckCircle className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-gray-900 mb-1">Confirmar Rotas</h4>
            <p className="text-sm text-gray-600">Confirmar rotas para execução (D+0)</p>
          </Link>
        </div>
      </div>
    </div>
  );
}