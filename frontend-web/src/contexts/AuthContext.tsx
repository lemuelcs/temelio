import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  nome: string;
  perfil: 'DESPACHANTE_PLANEJADOR' | 'MOTORISTA' | 'ADMINISTRADOR';
  deveAlterarSenha: boolean;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<User | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data?.data?.user ?? response.data?.data ?? null;
      if (userData) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return userData;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Erro ao carregar perfil do usuário');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!savedToken) {
        setLoading(false);
        return;
      }

      setToken(savedToken);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      try {
        await refreshProfile();
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      
      const { user: userData, token: userToken } = response.data.data;
       
      setUser(userData);
      setToken(userToken);
       
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
