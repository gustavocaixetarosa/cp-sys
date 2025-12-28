import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import type { Cliente, Contrato, Pagamento, CreateClienteDTO, CreateContratoDTO, UpdateContratoDTO, UpdatePagamentoDTO, StatusPagamento } from '../types';
import { clienteService, contratoService, pagamentoService } from '../services/api';
import { format, parseISO, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

export type PaymentFilterStatus = StatusPagamento | 'TODOS';

export interface PaymentFilters {
  status: PaymentFilterStatus;
  dateFrom: string | null;
  dateTo: string | null;
}

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
  paymentFilters: PaymentFilters;

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
  getFilteredPagamentosByContrato: (contrato_id: number) => Pagamento[];
  marcarPagamentoComoPago: (pagamento_id: number, data_pagamento: string) => Promise<void>;

  // Search & Filter
  setSearchTerm: (term: string) => void;
  getFilteredClientes: () => Cliente[];
  setPaymentFilters: (filters: Partial<PaymentFilters>) => void;
  clearPaymentFilters: () => void;
  filterByAtrasados: () => void;
  isFilteringContratosAtrasados: boolean;
  contratoTemPagamentoAtrasado: (contrato_id: number) => boolean;

  // Statistics
  getTotalReceber: (cliente_id: number) => number;
  getTotalAtrasado: (cliente_id: number) => number;
  getClientesComAtrasados: () => Cliente[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultPaymentFilters: PaymentFilters = {
  status: 'TODOS',
  dateFrom: null,
  dateTo: null,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentFilters, setPaymentFiltersState] = useState<PaymentFilters>(defaultPaymentFilters);
  const [filterContratosAtrasados, setFilterContratosAtrasados] = useState(false);
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
    try {
      const updateDTO: CreateClienteDTO = {
        nome: cliente.nome,
        endereco: cliente.endereco,
        telefone: cliente.telefone,
        registro: cliente.registro,
        banco: cliente.banco,
        dataContrato: cliente.data_vencimento,
        taxaMulta: cliente.taxa_multa,
        taxaJurosMensal: cliente.taxa_juros_mensal,
      };
      
      const updated = await clienteService.update(cliente.cliente_id, updateDTO);
      setClientes(clientes.map((c: Cliente) => (c.cliente_id === updated.cliente_id ? updated : c)));
      if (selectedCliente?.cliente_id === updated.cliente_id) {
        setSelectedCliente(updated);
      }
      toast({ title: 'Cliente atualizado', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar cliente', status: 'error' });
      throw error;
    }
  };

  const deleteCliente = async (cliente_id: number) => {
    if (!cliente_id || isNaN(Number(cliente_id))) {
      toast({ title: 'ID do cliente inválido', status: 'error' });
      return;
    }
    try {
      await clienteService.delete(Number(cliente_id));
      // Delete related contratos and pagamentos from state
      const contratoIds = contratos.filter((c: Contrato) => c.cliente_id === cliente_id).map((c: Contrato) => c.contrato_id);
      setPagamentos(pagamentos.filter((p: Pagamento) => !contratoIds.includes(p.contrato_id)));
      setContratos(contratos.filter((c: Contrato) => c.cliente_id !== cliente_id));
      setClientes(clientes.filter((c: Cliente) => c.cliente_id !== cliente_id));
      
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
    try {
      const updateDTO: UpdateContratoDTO = {
        clienteId: contrato.cliente_id,
        nomeContratante: contrato.nome_contratante,
        cpfContratante: contrato.cpf_contratante,
        duracaoEmMeses: contrato.duracao_em_meses,
        dataInicioContrato: contrato.data,
        valorContrato: contrato.valor_contrato,
      };
      
      const updated = await contratoService.update(contrato.contrato_id, updateDTO);
      setContratos(contratos.map((c: Contrato) => (c.contrato_id === updated.contrato_id ? updated : c)));
      if (selectedContrato?.contrato_id === updated.contrato_id) {
        setSelectedContrato(updated);
      }
      toast({ title: 'Contrato atualizado', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar contrato', status: 'error' });
      throw error;
    }
  };

  const deleteContrato = async (contrato_id: number) => {
    if (!contrato_id || isNaN(Number(contrato_id))) {
      toast({ title: 'ID do contrato inválido', status: 'error' });
      return;
    }
    try {
      await contratoService.delete(Number(contrato_id));
      setPagamentos(pagamentos.filter((p: Pagamento) => p.contrato_id !== contrato_id));
      setContratos(contratos.filter((c: Contrato) => c.contrato_id !== contrato_id));
      
      if (selectedContrato?.contrato_id === contrato_id) {
        setSelectedContrato(null);
      }
      toast({ title: 'Contrato excluído', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao excluir contrato', status: 'error' });
      throw error;
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

  // Check if contract has overdue payments
  const contratoTemPagamentoAtrasado = (contrato_id: number): boolean => {
    return pagamentos.some((p) => p.contrato_id === contrato_id && pagamentoEstaAtrasado(p));
  };

  const getContratosByCliente = (cliente_id: number): Contrato[] => {
    let filtered = contratos.filter((c: Contrato) => c.cliente_id === cliente_id);
    
    // Se o filtro de contratos atrasados estiver ativo, mostrar apenas contratos com pagamentos atrasados
    if (filterContratosAtrasados) {
      filtered = filtered.filter((c: Contrato) => contratoTemPagamentoAtrasado(c.contrato_id));
    }
    
    return filtered;
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
      setPagamentos(pagamentos.map((p: Pagamento) => (p.pagamento_id === updated.pagamento_id ? updated : p)));
      toast({ title: 'Pagamento atualizado', status: 'success' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar pagamento', status: 'error' });
      throw error;
    }
  };

  const deletePagamento = async (pagamento_id: number) => {
    console.warn('Delete pagamento não persistido no backend');
    setPagamentos(pagamentos.filter((p: Pagamento) => p.pagamento_id !== pagamento_id));
  };

  const getPagamentosByContrato = (contrato_id: number): Pagamento[] => {
    return pagamentos.filter((p: Pagamento) => p.contrato_id === contrato_id).sort((a: Pagamento, b: Pagamento) => a.numero_parcela - b.numero_parcela);
  };

  const getFilteredPagamentosByContrato = (contrato_id: number): Pagamento[] => {
    let filtered = pagamentos.filter((p: Pagamento) => p.contrato_id === contrato_id);

    // Filtro por status
    if (paymentFilters.status !== 'TODOS') {
      filtered = filtered.filter((p: Pagamento) => {
        // Calcular status real considerando atrasos não atualizados
        const vencimento = parseISO(p.data_vencimento);
        const hoje = new Date();
        const estaAtrasadoCalculado = p.status === 'EM_ABERTO' && isBefore(vencimento, startOfDay(hoje));
        const statusReal = estaAtrasadoCalculado ? 'ATRASADO' : p.status;
        return statusReal === paymentFilters.status;
      });
    }

    // Filtro por data de vencimento (de)
    if (paymentFilters.dateFrom) {
      const dateFrom = startOfDay(parseISO(paymentFilters.dateFrom));
      filtered = filtered.filter((p: Pagamento) => {
        const vencimento = parseISO(p.data_vencimento);
        return !isBefore(vencimento, dateFrom);
      });
    }

    // Filtro por data de vencimento (até)
    if (paymentFilters.dateTo) {
      const dateTo = endOfDay(parseISO(paymentFilters.dateTo));
      filtered = filtered.filter((p: Pagamento) => {
        const vencimento = parseISO(p.data_vencimento);
        return !isAfter(vencimento, dateTo);
      });
    }

    return filtered.sort((a: Pagamento, b: Pagamento) => a.numero_parcela - b.numero_parcela);
  };

  // Payment Filters
  const setPaymentFilters = (filters: Partial<PaymentFilters>) => {
    setPaymentFiltersState((prev: PaymentFilters) => ({ ...prev, ...filters }));
  };

  const clearPaymentFilters = () => {
    setPaymentFiltersState(defaultPaymentFilters);
    setFilterContratosAtrasados(false);
  };

  const filterByAtrasados = () => {
    // Toggle do filtro de contratos com pagamentos atrasados
    setFilterContratosAtrasados(!filterContratosAtrasados);
  };

  const marcarPagamentoComoPago = async (pagamento_id: number, data_pagamento: string) => {
    const pagamento = pagamentos.find((p: Pagamento) => p.pagamento_id === pagamento_id);
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
      setPagamentos(pagamentos.map((p: Pagamento) => (p.pagamento_id === updated.pagamento_id ? updated : p)));
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
      (c: Cliente) =>
        c.nome.toLowerCase().includes(term) ||
        c.registro.toLowerCase().includes(term) ||
        c.telefone.toLowerCase().includes(term)
    );
  };

  // Statistics
  const getTotalReceber = (cliente_id: number): number => {
    const clienteContratos = contratos.filter((c: Contrato) => c.cliente_id === cliente_id);
    const contratoIds = clienteContratos.map((c: Contrato) => c.contrato_id);
    
    return pagamentos
      .filter((p: Pagamento) => contratoIds.includes(p.contrato_id) && p.status !== 'PAGO' && p.status !== 'PAGO_COM_ATRASO')
      .reduce((sum: number, p: Pagamento) => sum + p.valor, 0);
  };

  const getTotalAtrasado = (cliente_id: number): number => {
    const clienteContratos = contratos.filter((c: Contrato) => c.cliente_id === cliente_id);
    const contratoIds = clienteContratos.map((c: Contrato) => c.contrato_id);
    const hoje = new Date();
    
    return pagamentos
      .filter((p: Pagamento) => {
        if (!contratoIds.includes(p.contrato_id)) return false;
        // Considerar tanto status ATRASADO quanto EM_ABERTO com vencimento passado
        if (p.status === 'ATRASADO') return true;
        if (p.status === 'EM_ABERTO') {
          const vencimento = parseISO(p.data_vencimento);
          return isBefore(vencimento, startOfDay(hoje));
        }
        return false;
      })
      .reduce((sum: number, p: Pagamento) => sum + p.valor, 0);
  };

  const getClientesComAtrasados = (): Cliente[] => {
    const hoje = new Date();
    const clienteIdsComAtrasados = new Set<number>();

    pagamentos.forEach((p: Pagamento) => {
      const isAtrasado = p.status === 'ATRASADO' || 
        (p.status === 'EM_ABERTO' && isBefore(parseISO(p.data_vencimento), startOfDay(hoje)));
      
      if (isAtrasado) {
        const contrato = contratos.find((c: Contrato) => c.contrato_id === p.contrato_id);
        if (contrato) {
          clienteIdsComAtrasados.add(contrato.cliente_id);
        }
      }
    });

    return clientes.filter((c: Cliente) => clienteIdsComAtrasados.has(c.cliente_id));
  };

  const value: AppContextType = {
    clientes,
    contratos,
    pagamentos,
    selectedCliente,
    selectedContrato,
    searchTerm,
    isLoading,
    paymentFilters,
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
    getFilteredPagamentosByContrato,
    marcarPagamentoComoPago,
    setSearchTerm,
    getFilteredClientes,
    setPaymentFilters,
    clearPaymentFilters,
    filterByAtrasados,
    isFilteringContratosAtrasados: filterContratosAtrasados,
    contratoTemPagamentoAtrasado,
    getTotalReceber,
    getTotalAtrasado,
    getClientesComAtrasados,
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
