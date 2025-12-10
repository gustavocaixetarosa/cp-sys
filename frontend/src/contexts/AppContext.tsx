import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import type { Cliente, Contrato, Pagamento, CreateClienteDTO, CreateContratoDTO, UpdatePagamentoDTO } from '../types';
import { clienteService, contratoService, pagamentoService } from '../services/api';
import { format, parseISO, isBefore } from 'date-fns';

interface AppContextType {
  // State
  clientes: Cliente[];
  contratos: Contrato[];
  pagamentos: Pagamento[];
  selectedCliente: Cliente | null;
  selectedContrato: Contrato | null;
  searchTerm: string;
  isLoading: boolean;

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
  const toast = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [clientesData, contratosData, pagamentosData] = await Promise.all([
          clienteService.getAll(),
          contratoService.getAll(),
          pagamentoService.getAll(),
        ]);
        setClientes(clientesData);
        setContratos(contratosData);
        setPagamentos(pagamentosData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível conectar ao servidor.',
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

  const getContratosByCliente = (cliente_id: number): Contrato[] => {
    return contratos.filter((c) => c.cliente_id === cliente_id);
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
      .filter((p) => contratoIds.includes(p.contrato_id) && p.status === 'ATRASADO')
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
