import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import api, { isTokenExpired } from '../services/api';

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
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const refreshIntervalRef = useRef<number | null>(null);

  // Função para renovar o token
  const refreshTokenFn = async (): Promise<boolean> => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        throw new Error('No refresh token');
      }

      console.log('Renovando token...');
      const response = await api.post<AuthResponse>('/auth/refresh', {
        refreshToken: refresh,
      });

      const { token, refreshToken: newRefresh, usuario } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefresh);
      localStorage.setItem('user', JSON.stringify(usuario));

      setUser(usuario);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Token renovado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  };

  // Configura o intervalo de renovação automática do token
  const setupTokenRefresh = () => {
    // Limpa qualquer intervalo anterior
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Verifica a cada 10 minutos se o token precisa ser renovado
    refreshIntervalRef.current = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token, 15)) {
        console.log('Token próximo de expirar, renovando automaticamente...');
        const success = await refreshTokenFn();
        if (!success) {
          // Se falhar ao renovar, faz logout
          logoutFn();
        }
      }
    }, 10 * 60 * 1000); // 10 minutos
  };

  // Função de logout
  const logoutFn = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    
    // Limpa o intervalo de renovação
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    toast({
      title: 'Logout realizado',
      status: 'info',
      duration: 2000,
    });
  };

  // Inicializa o auth state a partir do localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && storedUser && refreshToken) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Verifica se o token está expirado ou próximo de expirar
          if (isTokenExpired(token, 5)) {
            console.log('Token expirado ou próximo de expirar, tentando renovar...');
            const success = await refreshTokenFn();
            
            if (success) {
              // Token renovado com sucesso, continua com o usuário logado
              setupTokenRefresh();
            } else {
              // Falha ao renovar, faz logout
              console.log('Não foi possível renovar o token, fazendo logout...');
              logoutFn();
            }
          } else {
            // Token ainda válido
            setUser(userData);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setupTokenRefresh();
          }
        } catch (error) {
          console.error('Erro ao inicializar autenticação:', error);
          logoutFn();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Cleanup ao desmontar
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
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

      // Configura a renovação automática do token
      setupTokenRefresh();

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

      // Configura a renovação automática do token
      setupTokenRefresh();

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

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout: logoutFn,
    refreshToken: refreshTokenFn,
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

