import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Cliente, Contrato, Pagamento } from '../types';
import { clientes as initialClientes, contratos as initialContratos, pagamentos as initialPagamentos } from '../data/mockData';
import { format, parseISO, isBefore } from 'date-fns';

interface AppContextType {
  // State
  clientes: Cliente[];
  contratos: Contrato[];
  pagamentos: Pagamento[];
  selectedCliente: Cliente | null;
  selectedContrato: Contrato | null;
  searchTerm: string;

  // Cliente CRUD
  addCliente: (cliente: Omit<Cliente, 'cliente_id'>) => void;
  updateCliente: (cliente: Cliente) => void;
  deleteCliente: (cliente_id: number) => void;
  selectCliente: (cliente: Cliente | null) => void;

  // Contrato CRUD
  addContrato: (contrato: Omit<Contrato, 'contrato_id'>) => void;
  updateContrato: (contrato: Contrato) => void;
  deleteContrato: (contrato_id: number) => void;
  selectContrato: (contrato: Contrato | null) => void;
  getContratosByCliente: (cliente_id: number) => Contrato[];

  // Pagamento CRUD
  addPagamento: (pagamento: Omit<Pagamento, 'pagamento_id'>) => void;
  updatePagamento: (pagamento: Pagamento) => void;
  deletePagamento: (pagamento_id: number) => void;
  getPagamentosByContrato: (contrato_id: number) => Pagamento[];
  marcarPagamentoComoPago: (pagamento_id: number, data_pagamento: string) => void;

  // Search & Filter
  setSearchTerm: (term: string) => void;
  getFilteredClientes: () => Cliente[];

  // Statistics
  getTotalReceber: (cliente_id: number) => number;
  getTotalAtrasado: (cliente_id: number) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [contratos, setContratos] = useState<Contrato[]>(initialContratos);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(initialPagamentos);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cliente CRUD
  const addCliente = (clienteData: Omit<Cliente, 'cliente_id'>) => {
    const newCliente: Cliente = {
      ...clienteData,
      cliente_id: Math.max(...clientes.map((c) => c.cliente_id), 0) + 1,
    };
    setClientes([...clientes, newCliente]);
  };

  const updateCliente = (cliente: Cliente) => {
    setClientes(clientes.map((c) => (c.cliente_id === cliente.cliente_id ? cliente : c)));
    if (selectedCliente?.cliente_id === cliente.cliente_id) {
      setSelectedCliente(cliente);
    }
  };

  const deleteCliente = (cliente_id: number) => {
    // Delete related contratos and pagamentos
    const contratoIds = contratos.filter((c) => c.cliente_id === cliente_id).map((c) => c.contrato_id);
    setPagamentos(pagamentos.filter((p) => !contratoIds.includes(p.contrato_id)));
    setContratos(contratos.filter((c) => c.cliente_id !== cliente_id));
    setClientes(clientes.filter((c) => c.cliente_id !== cliente_id));
    
    if (selectedCliente?.cliente_id === cliente_id) {
      setSelectedCliente(null);
      setSelectedContrato(null);
    }
  };

  const selectCliente = (cliente: Cliente | null) => {
    setSelectedCliente(cliente);
    setSelectedContrato(null);
  };

  // Contrato CRUD
  const addContrato = (contratoData: Omit<Contrato, 'contrato_id'>) => {
    const newContrato: Contrato = {
      ...contratoData,
      contrato_id: Math.max(...contratos.map((c) => c.contrato_id), 0) + 1,
    };
    setContratos([...contratos, newContrato]);

    // Generate pagamentos for the new contrato
    const valorParcela = contratoData.valor_contrato / contratoData.duracao_em_meses;
    const newPagamentos: Pagamento[] = [];
    
    for (let i = 0; i < contratoData.duracao_em_meses; i++) {
      const dataVencimento = new Date(contratoData.data);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);
      
      newPagamentos.push({
        pagamento_id: Math.max(...pagamentos.map((p) => p.pagamento_id), 0) + i + 1,
        contrato_id: newContrato.contrato_id,
        valor: valorParcela,
        data_pagamento: '',
        data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
        numero_parcela: i + 1,
        status: 'ABERTO',
        observacao: '',
      });
    }
    
    setPagamentos([...pagamentos, ...newPagamentos]);
  };

  const updateContrato = (contrato: Contrato) => {
    setContratos(contratos.map((c) => (c.contrato_id === contrato.contrato_id ? contrato : c)));
    if (selectedContrato?.contrato_id === contrato.contrato_id) {
      setSelectedContrato(contrato);
    }
  };

  const deleteContrato = (contrato_id: number) => {
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
  const addPagamento = (pagamentoData: Omit<Pagamento, 'pagamento_id'>) => {
    const newPagamento: Pagamento = {
      ...pagamentoData,
      pagamento_id: Math.max(...pagamentos.map((p) => p.pagamento_id), 0) + 1,
    };
    setPagamentos([...pagamentos, newPagamento]);
  };

  const updatePagamento = (pagamento: Pagamento) => {
    setPagamentos(pagamentos.map((p) => (p.pagamento_id === pagamento.pagamento_id ? pagamento : p)));
  };

  const deletePagamento = (pagamento_id: number) => {
    setPagamentos(pagamentos.filter((p) => p.pagamento_id !== pagamento_id));
  };

  const getPagamentosByContrato = (contrato_id: number): Pagamento[] => {
    return pagamentos.filter((p) => p.contrato_id === contrato_id).sort((a, b) => a.numero_parcela - b.numero_parcela);
  };

  const marcarPagamentoComoPago = (pagamento_id: number, data_pagamento: string) => {
    const pagamento = pagamentos.find((p) => p.pagamento_id === pagamento_id);
    if (!pagamento) return;

    const vencimento = parseISO(pagamento.data_vencimento);
    const pagamentoDate = parseISO(data_pagamento);
    const status = isBefore(pagamentoDate, vencimento) || format(pagamentoDate, 'yyyy-MM-dd') === format(vencimento, 'yyyy-MM-dd')
      ? 'PAGO'
      : 'PAGO_COM_ATRASO';

    updatePagamento({
      ...pagamento,
      data_pagamento,
      status,
      observacao: `Pago em ${data_pagamento}`,
    });
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

