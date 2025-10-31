// frontend/src/components/layout/LayoutMotorista.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Truck, User, LogOut, Menu, Home } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export function LayoutMotorista() {
  const [showMenu, setShowMenu] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Buscar ofertas pendentes para o motorista (do dia + dia seguinte)
  const { data: rotasOferecidas = [] } = useQuery({
    queryKey: ['rotas-oferecidas-count', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/ofertas-rotas', {
          params: {
            motoristaId: user?.id,
            status: 'PENDENTE',
          },
        });
        const dados = response.data?.data?.ofertas || response.data?.ofertas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas oferecidas:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar rotas agendadas e confirmadas (do dia + dia seguinte)
  const { data: rotasAceitasOuConfirmadas = [] } = useQuery({
    queryKey: ['rotas-motorista-count', user?.id],
    queryFn: async () => {
      try {
        const response = await api.get('/rotas', {
          params: {
            motoristaId: user?.id,
            status: ['ACEITA', 'CONFIRMADA', 'EM_ANDAMENTO'],
          },
        });
        const dados = response.data?.data?.rotas || response.data?.rotas || response.data;
        return Array.isArray(dados) ? dados : [];
      } catch (error) {
        console.error('Erro ao buscar rotas confirmadas:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Filtrar rotas do dia + dia seguinte
  const filtrarRotasProximosDias = useMemo(() => {
    return (rotas: any[]) => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const depoisDeAmanha = new Date(hoje);
      depoisDeAmanha.setDate(depoisDeAmanha.getDate() + 2);

      return rotas.filter((item: any) => {
        const rota = item.rota || item;
        if (!rota.dataRota) return false;

        const dataRota = new Date(rota.dataRota);
        const dataRotaNormalizada = new Date(
          dataRota.getUTCFullYear(),
          dataRota.getUTCMonth(),
          dataRota.getUTCDate()
        );
        dataRotaNormalizada.setHours(0, 0, 0, 0);

        return dataRotaNormalizada >= hoje && dataRotaNormalizada < depoisDeAmanha;
      });
    };
  }, []);

  // Contar ofertas do dia + dia seguinte
  const quantidadeOfertas = useMemo(() => {
    return filtrarRotasProximosDias(rotasOferecidas).length;
  }, [rotasOferecidas, filtrarRotasProximosDias]);

  // Contar rotas agendadas + confirmadas do dia + dia seguinte
  const quantidadeRotasAgendadasConfirmadas = useMemo(() => {
    return filtrarRotasProximosDias(rotasAceitasOuConfirmadas).length;
  }, [rotasAceitasOuConfirmadas, filtrarRotasProximosDias]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header fixo no topo */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 fixed top-0 w-full z-20 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" />
            <div>
              <h1 className="font-bold text-lg">Temelio Driver</h1>
              <p className="text-xs text-blue-100">
                Olá, {user?.nome?.split(' ')[0]}!
              </p>
            </div>
          </div>

          {/* Espaço vazio para manter o centro */}
          <div className="w-10"></div>
        </div>

        {/* Menu dropdown */}
        {showMenu && (
          <div className="absolute top-16 left-4 bg-white text-gray-800 rounded-lg shadow-xl py-2 w-56 z-30">
            <NavLink
              to="/motorista/dashboard"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/motorista/disponibilidade"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Disponibilidade</span>
            </NavLink>
            <NavLink
              to="/motorista/rotas"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Minhas Rotas</span>
            </NavLink>
            <NavLink
              to="/motorista/perfil"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </NavLink>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors w-full text-left text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </header>

      {/* Conteúdo principal */}
      <main className="pt-20 px-4 max-w-7xl mx-auto pb-6">
        <Outlet />
      </main>

      {/* Bottom Navigation fixo */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="flex justify-around max-w-7xl mx-auto">
          <NavLink
            to="/motorista/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 px-2 transition-colors flex-1 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`
            }
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </NavLink>

          <NavLink
            to="/motorista/disponibilidade"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 px-2 transition-colors flex-1 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`
            }
          >
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Disponibilidade</span>
          </NavLink>

          <NavLink
            to="/motorista/rotas"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 px-2 transition-colors flex-1 relative ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`
            }
          >
            {/* Badge de ofertas (vermelho, acima e à esquerda) */}
            {quantidadeOfertas > 0 && (
              <span className="absolute top-1 left-1/4 transform -translate-x-1/2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {quantidadeOfertas}
              </span>
            )}

            {/* Badge de rotas agendadas/confirmadas (verde, à direita) */}
            {quantidadeRotasAgendadasConfirmadas > 0 && (
              <span className="absolute top-1 right-1/4 transform translate-x-1/2 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {quantidadeRotasAgendadasConfirmadas}
              </span>
            )}

            <Truck className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Minhas Rotas</span>
          </NavLink>

          <NavLink
            to="/motorista/perfil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 px-2 transition-colors flex-1 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`
            }
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Perfil</span>
          </NavLink>
        </div>
      </nav>

      {/* Overlay do menu */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
