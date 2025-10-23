import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Motoristas from './pages/motoristas/Motoristas';
import Rotas from './pages/rotas/Rotas';
import RotasAlocar from './pages/rotas/RotasAlocar';
import RotasConfirmar from './pages/rotas/RotasConfirmar';
import RotasValidar from './pages/rotas/RotasValidar';
import GestaoDisponibilidades from './pages/disponibilidades/GestaoDisponibilidades';
import GestaoDisponibilidadesResumo from './pages/disponibilidades/GestaoDisponibilidadesResumo';
import Alertas from './pages/alertas/Alertas';
import Locais from './pages/ajustes/Locais';
import Precos from './pages/ajustes/Precos';

// Layout
import Layout from './components/layout/Layout';

// Ambiente do Motorista
import { LayoutMotorista } from './components/layout/LayoutMotorista';
import DisponibilidadeMotorista from './pages/motorista/DisponibilidadeMotorista';
import RotasMotorista from './pages/motorista/RotasMotorista';
import PerfilMotorista from './pages/motorista/PerfilMotorista';

// ✅ NOVO: Dashboard do Motorista
import DashboardMotorista from './pages/motorista/DashboardMotorista';

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Rota Privada
function PrivateRoute({ 
  children, 
  allowedProfiles 
}: { 
  children: React.ReactNode;
  allowedProfiles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedProfiles && !allowedProfiles.includes(user.perfil)) {
    // ✅ Redirecionar para página correta baseado no perfil
    const redirectTo = user.perfil === 'MOTORISTA' 
      ? '/motorista/dashboard' 
      : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// Rotas da aplicação
function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Redirect da raiz baseado no perfil */}
        <Route
          path="/"
          element={
            user?.perfil === 'MOTORISTA' ? (
              <Navigate to="/motorista/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        
        {/* ========================================
            ROTAS DA GESTÃO
            ======================================== */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/motoristas"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <Motoristas />
              </Layout>
            </PrivateRoute>
          }
        />
        
        {/* ROTAS - Submenus */}
        <Route
          path="/rotas"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <Rotas />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/rotas/alocar"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <RotasAlocar />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/rotas/confirmar"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <RotasConfirmar />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/rotas/validar"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <RotasValidar />
              </Layout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/disponibilidades"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <GestaoDisponibilidades />
              </Layout>
            </PrivateRoute>
          }
        />
        
        {/* Resumo de Disponibilidade */}
        <Route
          path="/disponibilidade"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <GestaoDisponibilidadesResumo />
              </Layout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/alertas"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <Alertas />
              </Layout>
            </PrivateRoute>
          }
        />
        
        {/* AJUSTES - Submenus */}
        <Route
          path="/ajustes/precos"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR']}>
              <Layout>
                <Precos />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/ajustes/locais"
          element={
            <PrivateRoute allowedProfiles={['ADMINISTRADOR', 'DESPACHANTE_PLANEJADOR']}>
              <Layout>
                <Locais />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* ========================================
            ROTAS DO MOTORISTA
            ======================================== */}
        
        {/* ✅ NOVA ROTA: Dashboard do Motorista (SEM Layout) */}
        <Route
          path="/motorista/dashboard"
          element={
            <PrivateRoute allowedProfiles={['MOTORISTA']}>
              <DashboardMotorista />
            </PrivateRoute>
          }
        />
        
        {/* Rotas do Motorista (COM Layout) */}
        <Route
          path="/motorista/*"
          element={
            <PrivateRoute allowedProfiles={['MOTORISTA']}>
              <LayoutMotorista />
            </PrivateRoute>
          }
        >
          <Route path="disponibilidade" element={<DisponibilidadeMotorista />} />
          <Route path="rotas" element={<RotasMotorista />} />
          <Route path="perfil" element={<PerfilMotorista />} />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toaster FORA das Routes, mas DENTRO do fragmento */}
      <Toaster position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}