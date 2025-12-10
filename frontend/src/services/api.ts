import axios from 'axios';
import type { Cliente, Contrato, Pagamento, CreateClienteDTO, CreateContratoDTO, UpdatePagamentoDTO } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const clienteService = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get<Cliente[]>('/clientes');
    return response.data;
  },
  
  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  create: async (cliente: CreateClienteDTO): Promise<Cliente> => {
    const response = await api.post<Cliente>('/clientes', cliente);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  }
};

export const contratoService = {
  getAll: async (): Promise<Contrato[]> => {
    const response = await api.get<Contrato[]>('/contratos');
    return response.data;
  },

  getById: async (id: number): Promise<Contrato> => {
    const response = await api.get<Contrato>(`/contratos/${id}`);
    return response.data;
  },

  create: async (contrato: CreateContratoDTO): Promise<Contrato> => {
    const response = await api.post<Contrato>('/contratos', contrato);
    return response.data;
  }
};

export const pagamentoService = {
  getAll: async (): Promise<Pagamento[]> => {
    const response = await api.get<Pagamento[]>('/pagamentos');
    return response.data;
  },

  update: async (id: number, pagamento: UpdatePagamentoDTO): Promise<Pagamento> => {
    const response = await api.put<Pagamento>(`/pagamentos/${id}`, pagamento);
    return response.data;
  }
};

export default api;
