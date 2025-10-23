// frontend/src/components/layout/LayoutMotorista.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Truck, User, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function LayoutMotorista() {
  const [showMenu, setShowMenu] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header fixo no topo */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 fixed top-0 w-full z-20 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" />
            <div>
              <h1 className="font-bold text-lg">Temelio Driver</h1>
              <p className="text-xs text-blue-100">
                Olá, {user?.nome?.split(' ')[0]}!
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Menu dropdown */}
        {showMenu && (
          <div className="absolute top-16 right-4 bg-white text-gray-800 rounded-lg shadow-xl py-2 w-48 z-30">
            <NavLink
              to="/motorista/perfil"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </NavLink>
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
            to="/motorista/disponibilidade"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 px-4 transition-colors flex-1 ${
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
              `flex flex-col items-center justify-center py-3 px-4 transition-colors flex-1 ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`
            }
          >
            <Truck className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Minhas Rotas</span>
          </NavLink>

          <NavLink
            to="/motorista/perfil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 px-4 transition-colors flex-1 ${
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
