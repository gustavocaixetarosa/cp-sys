export interface Contrato {
  contrato_id: number;
  cliente_id: number;
  duracao_em_meses: number;
  cpf_contratante: string;
  nome_contratante: string;
  data: string;
  valor_contrato: number;
}

export interface Pagamento {
  pagamento_id: number;
  contrato_id: number;
  valor: number;
  data_pagamento: string;
  data_vencimento: string;
  numero_parcela: number;
  status: 'ABERTO' | 'PAGO' | 'PAGO_COM_ATRASO' | 'ATRASADO';
  observacao?: string;
}

export interface Cliente {
  cliente_id: number;
  nome: string;
  endereco: string;
  registro: string;
  telefone: string;
  data_vencimento: string;
  banco: string;
}

