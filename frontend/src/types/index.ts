export type StatusPagamento = 'EM_ABERTO' | 'PAGO' | 'PAGO_COM_ATRASO' | 'ATRASADO';

export interface Contrato {
  contrato_id: number;
  cliente_id: number;
  duracao_em_meses: number;
  cpf_contratante: string;
  nome_contratante: string;
  data: string;
  valor_contrato: number;
}

export interface CreateContratoDTO {
  clienteId: number;
  nomeContratante: string;
  cpfContratante: string;
  duracaoEmMeses: number;
  dataInicioContrato: string; // yyyy-MM-dd
  dataPrimeiraParcela: string; // yyyy-MM-dd
  valorContrato: number;
}

export interface UpdateContratoDTO {
  clienteId: number;
  nomeContratante: string;
  cpfContratante: string;
  duracaoEmMeses: number;
  dataInicioContrato: string; // yyyy-MM-dd
  dataPrimeiraParcela?: string; // opcional no update
  valorContrato: number;
}

export interface Pagamento {
  pagamento_id: number;
  contrato_id: number;
  valor: number;
  data_pagamento: string; // yyyy-MM-dd ou vazio
  data_vencimento: string; // yyyy-MM-dd
  numero_parcela: number;
  status: StatusPagamento;
  observacao?: string;
}

export interface UpdatePagamentoDTO {
  pagamento_id: number;
  contrato_id: number;
  valor: number;
  data_pagamento?: string;
  data_vencimento: string;
  status: StatusPagamento;
  observacao?: string;
  numero_parcela: number;
}

export interface Cliente {
  cliente_id: number;
  nome: string;
  endereco: string;
  registro: string;
  telefone: string;
  data_vencimento?: string; // Backend parece não retornar isso na lista principal, verificar
  banco: string;
}

export interface CreateClienteDTO {
  nome: string;
  endereco: string;
  telefone: string;
  registro: string;
  banco: string;
  dataContrato?: string; // Backend aceita isso no POST
}
