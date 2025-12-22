import axios from 'axios';
import type { Cliente, Contrato, Pagamento, CreateClienteDTO, CreateContratoDTO, UpdateContratoDTO, UpdatePagamentoDTO, RelatorioRequest, RelatorioResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Decodifica o JWT para extrair informações (sem validar assinatura)
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
};

// Verifica se o token está expirado ou próximo de expirar
export const isTokenExpired = (token: string, bufferMinutes: number = 5): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // Exp está em segundos, Date.now() está em milissegundos
  const expirationTime = decoded.exp * 1000;
  const bufferTime = bufferMinutes * 60 * 1000;
  
  // Retorna true se o token já expirou ou vai expirar nos próximos bufferMinutes
  return Date.now() >= (expirationTime - bufferTime);
};

// Request interceptor - adiciona token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - trata erros 401 (não autorizado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se erro 401 e não é retry e não é o endpoint de refresh
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        // Tenta renovar o token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/auth/refresh`,
            { refreshToken }
          );

          const { token, refreshToken: newRefresh, usuario } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefresh);
          if (usuario) {
            localStorage.setItem('user', JSON.stringify(usuario));
          }

          // Retry original request com novo token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Se falhar ao renovar, limpa tudo e redireciona para login
        console.error('Erro ao renovar token:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const clienteService = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
  },
  
  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${Number(id)}`);
    return response.data;
  },

  create: async (cliente: CreateClienteDTO): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', cliente);
    return response.data;
  },

  update: async (id: number, cliente: CreateClienteDTO): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${Number(id)}`, cliente);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${Number(id)}`);
  }
};

export const contratoService = {
  getAll: async (): Promise<Contrato[]> => {
    const response = await api.get<Contrato[]>('/contratos');
    return response.data;
  },

  getById: async (id: number): Promise<Contrato> => {
    const response = await api.get<Contrato>(`/contratos/${Number(id)}`);
    return response.data;
  },

  create: async (contrato: CreateContratoDTO): Promise<Contrato> => {
    const response = await api.post<Contrato>('/contratos', contrato);
    return response.data;
  },

  update: async (id: number, contrato: UpdateContratoDTO): Promise<Contrato> => {
    const response = await api.put<Contrato>(`/contratos/${Number(id)}`, contrato);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/contratos/${Number(id)}`);
  }
};

export const pagamentoService = {
  getAll: async (): Promise<Pagamento[]> => {
    const response = await api.get<Pagamento[]>('/pagamentos');
    return response.data;
  },

  update: async (id: number, pagamento: UpdatePagamentoDTO): Promise<Pagamento> => {
    const response = await api.put<Pagamento>(`/pagamentos/${Number(id)}`, pagamento);
    return response.data;
  }
};

export const relatorioService = {
  gerar: async (request: RelatorioRequest): Promise<RelatorioResponse> => {
    const response = await api.post<RelatorioResponse>('/relatorios', request);
    return response.data;
  }
};

export default api;
