import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import type { Cliente, Contrato, Pagamento, CreateClienteDTO, CreateContratoDTO, UpdatePagamentoDTO } from '../types';
import { clienteService, contratoService, pagamentoService } from '../services/api';
import { format, parseISO, isBefore, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

export interface FilterState {
  statusPagamento: string;
  statusContrato: string;
  periodo: string;
}

interface AppContextType {
  // State
  clientes: Cliente[];
  contratos: Contrato[];
  pagamentos: Pagamento[];
  selectedCliente: Cliente | null;
  selectedContrato: Contrato | null;
  searchTerm: string;
  isLoading: boolean;
  filters: FilterState;

  // Cliente CRUD
  addCliente: (cliente: CreateClienteDTO) => Promise<void>;
  updateCliente: (cliente: Cliente) => Promise<void>;
  deleteCliente: (cliente_id: number) => Promise<void>;
  selectCliente: (cliente: Cliente | null) => void;

  // Contrato CRUD
  addContrato: (contrato: CreateContratoDTO) => Promise<void>;
  updateContrato: (contrato: Contrato) => Promise<void>;
  deleteContrato: (contrato_id: number) => Promise<void>;
  selectContrato: (contrato: Contrato | null) => void;
  getContratosByCliente: (cliente_id: number) => Contrato[];

  // Pagamento CRUD
  addPagamento: (pagamento: Pagamento) => Promise<void>;
  updatePagamento: (pagamento: Pagamento) => Promise<void>;
  deletePagamento: (pagamento_id: number) => Promise<void>;
  getPagamentosByContrato: (contrato_id: number) => Pagamento[];
  marcarPagamentoComoPago: (pagamento_id: number, data_pagamento: string) => Promise<void>;

  // Search & Filter
  setSearchTerm: (term: string) => void;
  getFilteredClientes: () => Cliente[];
  setFilters: (filters: FilterState) => void;
  contratoTemPagamentoAtrasado: (contrato_id: number) => boolean;

  // Statistics
  getTotalReceber: (cliente_id: number) => number;
  getTotalAtrasado: (cliente_id: number) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    statusPagamento: 'todos',
    statusContrato: 'todos',
    periodo: 'todos',
  });
  const toast = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Usar Promise.allSettled para que uma falha não impeça as outras de carregar
        const [clientesResult, contratosResult, pagamentosResult] = await Promise.allSettled([
          clienteService.getAll(),
          contratoService.getAll(),
          pagamentoService.getAll(),
        ]);

        // Processar resultados individualmente
        if (clientesResult.status === 'fulfilled') {
          setClientes(clientesResult.value);
        } else {
          console.error('Erro ao carregar clientes:', clientesResult.reason);
          toast({
            title: 'Erro ao carregar clientes',
            description: 'Não foi possível carregar a lista de clientes.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }

        if (contratosResult.status === 'fulfilled') {
          setContratos(contratosResult.value);
        } else {
          console.error('Erro ao carregar contratos:', contratosResult.reason);
          // Não mostrar toast para contratos vazios, apenas log
          setContratos([]);
        }

        if (pagamentosResult.status === 'fulfilled') {
          setPagamentos(pagamentosResult.value);
        } else {
          console.error('Erro ao carregar pagamentos:', pagamentosResult.reason);
          // Não mostrar toast para pagamentos vazios, apenas log
          setPagamentos([]);
        }
      } catch (error) {
        console.error('Erro inesperado ao carregar dados:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Ocorreu um erro inesperado.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Cliente CRUD
  const addCliente = async (clienteData: CreateClienteDTO) => {
    try {
      const newCliente = await clienteService.create(clienteData);
      setClientes([...clientes, newCliente]);
      toast({ title: 'Cliente criado com sucesso', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao criar cliente', status: 'error' });
      throw error;
    }
  };

  const updateCliente = async (cliente: Cliente) => {
    console.warn('Update cliente não persistido no backend (endpoint não documentado)');
    setClientes(clientes.map((c) => (c.cliente_id === cliente.cliente_id ? cliente : c)));
    if (selectedCliente?.cliente_id === cliente.cliente_id) {
      setSelectedCliente(cliente);
    }
  };

  const deleteCliente = async (cliente_id: number) => {
    try {
      await clienteService.delete(cliente_id);
      // Delete related contratos and pagamentos from state
      const contratoIds = contratos.filter((c) => c.cliente_id === cliente_id).map((c) => c.contrato_id);
      setPagamentos(pagamentos.filter((p) => !contratoIds.includes(p.contrato_id)));
      setContratos(contratos.filter((c) => c.cliente_id !== cliente_id));
      setClientes(clientes.filter((c) => c.cliente_id !== cliente_id));
      
      if (selectedCliente?.cliente_id === cliente_id) {
        setSelectedCliente(null);
        setSelectedContrato(null);
      }
      toast({ title: 'Cliente excluído', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao excluir cliente', status: 'error' });
      throw error;
    }
  };

  const selectCliente = (cliente: Cliente | null) => {
    setSelectedCliente(cliente);
    setSelectedContrato(null);
  };

  // Contrato CRUD
  const addContrato = async (contratoData: CreateContratoDTO) => {
    try {
      const newContrato = await contratoService.create(contratoData);
      setContratos([...contratos, newContrato]);
      
      // Recarregar pagamentos pois o backend gera automaticamente
      const updatedPagamentos = await pagamentoService.getAll();
      setPagamentos(updatedPagamentos);
      
      toast({ title: 'Contrato criado com sucesso', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao criar contrato', status: 'error' });
      throw error;
    }
  };

  const updateContrato = async (contrato: Contrato) => {
    console.warn('Update contrato não persistido no backend');
    setContratos(contratos.map((c) => (c.contrato_id === contrato.contrato_id ? contrato : c)));
    if (selectedContrato?.contrato_id === contrato.contrato_id) {
      setSelectedContrato(contrato);
    }
  };

  const deleteContrato = async (contrato_id: number) => {
    console.warn('Delete contrato não persistido no backend');
    setPagamentos(pagamentos.filter((p) => p.contrato_id !== contrato_id));
    setContratos(contratos.filter((c) => c.contrato_id !== contrato_id));
    
    if (selectedContrato?.contrato_id === contrato_id) {
      setSelectedContrato(null);
    }
  };

  const selectContrato = (contrato: Contrato | null) => {
    setSelectedContrato(contrato);
  };

  // Helper function to check if a payment is overdue
  // Checks both explicit ATRASADO status and EM_ABERTO payments past due date
  const pagamentoEstaAtrasado = (pagamento: Pagamento): boolean => {
    if (pagamento.status === 'ATRASADO') {
      return true;
    }
    if (pagamento.status === 'EM_ABERTO') {
      const vencimento = parseISO(pagamento.data_vencimento);
      const hoje = new Date();
      return isBefore(vencimento, hoje);
    }
    return false;
  };

  const getContratosByCliente = (cliente_id: number): Contrato[] => {
    let filteredContratos = contratos.filter((c) => c.cliente_id === cliente_id);

    // Apply payment status filter
    if (filters.statusPagamento !== 'todos') {
      filteredContratos = filteredContratos.filter((contrato) => {
        const contratoPagamentos = pagamentos.filter((p) => p.contrato_id === contrato.contrato_id);
        
        if (filters.statusPagamento === 'ATRASADO') {
          // Contract has at least one overdue payment (ATRASADO or EM_ABERTO past due)
          return contratoPagamentos.some((p) => pagamentoEstaAtrasado(p));
        } else {
          // Contract has at least one payment with the specified status
          return contratoPagamentos.some((p) => p.status === filters.statusPagamento);
        }
      });
    }

    // Apply period filter
    if (filters.periodo !== 'todos') {
      const hoje = new Date();
      let startDate: Date;
      let endDate: Date = hoje;

      switch (filters.periodo) {
        case 'mes_atual':
          startDate = startOfMonth(hoje);
          endDate = endOfMonth(hoje);
          break;
        case 'mes_passado':
          startDate = startOfMonth(subMonths(hoje, 1));
          endDate = endOfMonth(subMonths(hoje, 1));
          break;
        case 'ultimos_3_meses':
          startDate = startOfMonth(subMonths(hoje, 2));
          endDate = endOfMonth(hoje);
          break;
        case 'ano_atual':
          startDate = startOfYear(hoje);
          endDate = endOfMonth(hoje);
          break;
        default:
          startDate = new Date(0);
      }

      filteredContratos = filteredContratos.filter((contrato) => {
        const contratoPagamentos = pagamentos.filter((p) => p.contrato_id === contrato.contrato_id);
        
        // Check if any payment falls within the period
        return contratoPagamentos.some((p) => {
          const vencimento = parseISO(p.data_vencimento);
          return vencimento >= startDate && vencimento <= endDate;
        });
      });
    }

    return filteredContratos;
  };

  // Pagamento CRUD
  const addPagamento = async (_pagamentoData: Pagamento) => {
    console.warn('Criação manual de pagamento não suportada pelo backend');
  };

  const updatePagamento = async (pagamento: Pagamento) => {
    try {
      const updateDTO: UpdatePagamentoDTO = {
        pagamento_id: pagamento.pagamento_id,
        contrato_id: pagamento.contrato_id,
        valor: pagamento.valor,
        data_pagamento: pagamento.data_pagamento,
        data_vencimento: pagamento.data_vencimento,
        status: pagamento.status,
        observacao: pagamento.observacao,
        numero_parcela: pagamento.numero_parcela
      };
      
      const updated = await pagamentoService.update(pagamento.pagamento_id, updateDTO);
      setPagamentos(pagamentos.map((p) => (p.pagamento_id === updated.pagamento_id ? updated : p)));
      toast({ title: 'Pagamento atualizado', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar pagamento', status: 'error' });
      throw error;
    }
  };

  const deletePagamento = async (pagamento_id: number) => {
    console.warn('Delete pagamento não persistido no backend');
    setPagamentos(pagamentos.filter((p) => p.pagamento_id !== pagamento_id));
  };

  const getPagamentosByContrato = (contrato_id: number): Pagamento[] => {
    return pagamentos.filter((p) => p.contrato_id === contrato_id).sort((a, b) => a.numero_parcela - b.numero_parcela);
  };

  const marcarPagamentoComoPago = async (pagamento_id: number, data_pagamento: string) => {
    const pagamento = pagamentos.find((p) => p.pagamento_id === pagamento_id);
    if (!pagamento) return;

    const vencimento = parseISO(pagamento.data_vencimento);
    const pagamentoDate = parseISO(data_pagamento);
    const status = isBefore(pagamentoDate, vencimento) || format(pagamentoDate, 'yyyy-MM-dd') === format(vencimento, 'yyyy-MM-dd')
      ? 'PAGO'
      : 'PAGO_COM_ATRASO';

    try {
      const updateDTO: UpdatePagamentoDTO = {
        ...pagamento,
        data_pagamento,
        status,
        observacao: `Pago em ${data_pagamento}`,
      };
      
      const updated = await pagamentoService.update(pagamento_id, updateDTO);
      setPagamentos(pagamentos.map((p) => (p.pagamento_id === updated.pagamento_id ? updated : p)));
      toast({ title: 'Pagamento registrado', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao registrar pagamento', status: 'error' });
    }
  };

  // Search & Filter
  const getFilteredClientes = (): Cliente[] => {
    if (!searchTerm) return clientes;
    
    const term = searchTerm.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.registro.toLowerCase().includes(term) ||
        c.telefone.toLowerCase().includes(term)
    );
  };

  // Check if contract has overdue payments
  const contratoTemPagamentoAtrasado = (contrato_id: number): boolean => {
    return pagamentos.some((p) => p.contrato_id === contrato_id && pagamentoEstaAtrasado(p));
  };

  // Statistics
  const getTotalReceber = (cliente_id: number): number => {
    const clienteContratos = contratos.filter((c) => c.cliente_id === cliente_id);
    const contratoIds = clienteContratos.map((c) => c.contrato_id);
    
    return pagamentos
      .filter((p) => contratoIds.includes(p.contrato_id) && p.status !== 'PAGO' && p.status !== 'PAGO_COM_ATRASO')
      .reduce((sum, p) => sum + p.valor, 0);
  };

  const getTotalAtrasado = (cliente_id: number): number => {
    const clienteContratos = contratos.filter((c) => c.cliente_id === cliente_id);
    const contratoIds = clienteContratos.map((c) => c.contrato_id);
    
    return pagamentos
      .filter((p) => contratoIds.includes(p.contrato_id) && pagamentoEstaAtrasado(p))
      .reduce((sum, p) => sum + p.valor, 0);
  };

  const value: AppContextType = {
    clientes,
    contratos,
    pagamentos,
    selectedCliente,
    selectedContrato,
    searchTerm,
    isLoading,
    filters,
    addCliente,
    updateCliente,
    deleteCliente,
    selectCliente,
    addContrato,
    updateContrato,
    deleteContrato,
    selectContrato,
    getContratosByCliente,
    addPagamento,
    updatePagamento,
    deletePagamento,
    getPagamentosByContrato,
    marcarPagamentoComoPago,
    setSearchTerm,
    getFilteredClientes,
    setFilters,
    contratoTemPagamentoAtrasado,
    getTotalReceber,
    getTotalAtrasado,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
