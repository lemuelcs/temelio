import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Truck,
  Calendar,
  Bell,
  MapPin,
  DollarSign,
  Menu,
  X,
  LogOut,
  User,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Settings,
  ClipboardList, // ⭐ NOVO: Ícone para Resumo
  Eye // ⭐ NOVO: Ícone para Monitoramento
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

// Estrutura de submenu para Rotas
const rotasSubmenu = [
  { path: '/rotas', icon: Truck, label: 'Ofertas (D-1)' },
  { path: '/rotas/alocar', icon: Truck, label: 'Alocar (D-1)' },
  { path: '/rotas/confirmar', icon: CheckCircle, label: 'Confirmar (D+0)' },
  { path: '/rotas/validar', icon: TrendingUp, label: 'Validar (D+1)' },
  { path: '/rotas/monitoramento', icon: Eye, label: 'Monitoramento' },
];

// ⭐ NOVO: Estrutura de submenu para Disponibilidades
const disponibilidadesSubmenu = [
  { path: '/disponibilidades', icon: Calendar, label: 'Gerenciar' },
  { path: '/disponibilidades/resumo', icon: ClipboardList, label: 'Resumo Consolidado' },
];

// Estrutura de submenu para Ajustes
const ajustesSubmenu = [
  { path: '/ajustes/precos', icon: DollarSign, label: 'Preços' },
  { path: '/ajustes/locais', icon: MapPin, label: 'Locais' },
];

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/motoristas', icon: Users, label: 'Motoristas' },
  { 
    path: '/rotas', 
    icon: Truck, 
    label: 'Rotas',
    submenu: rotasSubmenu 
  },
  // ⭐ ATUALIZADO: Disponibilidades agora tem submenu
  { 
    path: '/disponibilidades', 
    icon: Calendar, 
    label: 'Disponibilidades',
    submenu: disponibilidadesSubmenu 
  },
  { path: '/alertas', icon: Bell, label: 'Alertas' },
  { 
    path: '/ajustes', 
    icon: Settings, 
    label: 'Ajustes',
    submenu: ajustesSubmenu 
  },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rotasMenuOpen, setRotasMenuOpen] = useState(false);
  const [disponibilidadesMenuOpen, setDisponibilidadesMenuOpen] = useState(false); // ⭐ NOVO
  const [ajustesMenuOpen, setAjustesMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Verificar se alguma rota está ativa
  const isRotasActive = location.pathname.startsWith('/rotas');
  const isDisponibilidadesActive = location.pathname.startsWith('/disponibilidades');
  const isAjustesActive = location.pathname.startsWith('/ajustes');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 bg-gray-800">
            <Truck className="w-8 h-8 text-blue-500" />
            <span className="ml-3 text-white font-semibold text-lg">Temelio</span>
          </div>

          {/* Menu */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              // Item com submenu
              if (item.submenu) {
                // ⭐ ATUALIZADO: Determinar qual menu está aberto
                let isMenuOpen = false;
                let setMenuOpen: (value: boolean) => void = () => {};
                let isPathActive = false;

                if (item.path === '/rotas') {
                  isMenuOpen = rotasMenuOpen;
                  setMenuOpen = setRotasMenuOpen;
                  isPathActive = isRotasActive;
                } else if (item.path === '/disponibilidades') {
                  isMenuOpen = disponibilidadesMenuOpen;
                  setMenuOpen = setDisponibilidadesMenuOpen;
                  isPathActive = isDisponibilidadesActive;
                } else if (item.path === '/ajustes') {
                  isMenuOpen = ajustesMenuOpen;
                  setMenuOpen = setAjustesMenuOpen;
                  isPathActive = isAjustesActive;
                }
                
                return (
                  <div key={item.path}>
                    <button
                      onClick={() => setMenuOpen(!isMenuOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                        isPathActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </div>
                      {isMenuOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {isMenuOpen && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition ${
                                isSubActive
                                  ? 'bg-blue-700 text-white'
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <SubIcon className="w-4 h-4 mr-2" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Item normal (sem submenu)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 border-t border-gray-800 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{user?.nome}</p>
                <p className="text-xs text-gray-400">{user?.perfil}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      <div className={`fixed inset-0 z-50 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-900">
          <div className="flex h-16 items-center justify-between px-6 bg-gray-800">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-blue-500" />
              <span className="ml-3 text-white font-semibold text-lg">Temelio</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              if (item.submenu) {
                let isMenuOpen = false;
                let setMenuOpen: (value: boolean) => void = () => {};
                let isPathActive = false;

                if (item.path === '/rotas') {
                  isMenuOpen = rotasMenuOpen;
                  setMenuOpen = setRotasMenuOpen;
                  isPathActive = isRotasActive;
                } else if (item.path === '/disponibilidades') {
                  isMenuOpen = disponibilidadesMenuOpen;
                  setMenuOpen = setDisponibilidadesMenuOpen;
                  isPathActive = isDisponibilidadesActive;
                } else if (item.path === '/ajustes') {
                  isMenuOpen = ajustesMenuOpen;
                  setMenuOpen = setAjustesMenuOpen;
                  isPathActive = isAjustesActive;
                }
                
                return (
                  <div key={item.path}>
                    <button
                      onClick={() => setMenuOpen(!isMenuOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                        isPathActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </div>
                      {isMenuOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {isMenuOpen && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition ${
                                isSubActive
                                  ? 'bg-blue-700 text-white'
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              }`}
                            >
                              <SubIcon className="w-4 h-4 mr-2" />
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-shrink-0 border-t border-gray-800 p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-gray-400" />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{user?.nome}</p>
                <p className="text-xs text-gray-400">{user?.perfil}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header - Mobile */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <h1 className="text-lg font-semibold">Temelio</h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
