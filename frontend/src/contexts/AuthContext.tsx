import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import api from '../services/api';

interface User {
  id: number;
  nome: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  tipo: string;
  usuario: User;
}

interface LoginCredentials {
  email: string;
  senha: string;
}

interface RegisterCredentials {
  nome: string;
  email: string;
  senha: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Inicializa o auth state a partir do localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Configura o token no axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Erro ao inicializar autenticação:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { token, refreshToken: refresh, usuario } = response.data;

      // Salva no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(usuario));

      // Atualiza o state
      setUser(usuario);

      // Configura o token no axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo, ${usuario.nome}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro no login',
        description: error.response?.data || 'Credenciais inválidas',
        status: 'error',
        duration: 5000,
      });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', credentials);
      const { token, refreshToken: refresh, usuario } = response.data;

      // Salva no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(usuario));

      // Atualiza o state
      setUser(usuario);

      // Configura o token no axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast({
        title: 'Conta criada com sucesso!',
        description: `Bem-vindo, ${usuario.nome}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast({
        title: 'Erro no cadastro',
        description: error.response?.data || 'Erro ao criar conta',
        status: 'error',
        duration: 5000,
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    toast({
      title: 'Logout realizado',
      status: 'info',
      duration: 2000,
    });
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        throw new Error('No refresh token');
      }

      const response = await api.post<AuthResponse>('/auth/refresh', {
        refreshToken: refresh,
      });

      const { token, refreshToken: newRefresh, usuario } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefresh);
      localStorage.setItem('user', JSON.stringify(usuario));

      setUser(usuario);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

