package dev.gustavorosa.cobranca_cp.dto;

import dev.gustavorosa.cobranca_cp.model.Pagamento;

public record PagamentoDTO(
        Long pagamento_id,
        Long contrato_id,
        Double valor,
        Double valor_original,
        Double valor_atualizado,
        String data_pagamento,
        String data_vencimento,
        String status,
        String observacao,
        Integer numero_parcela
) {

    public PagamentoDTO(Pagamento pagamento){
        this(
                pagamento.getId(),
                pagamento.getContrato().getId(),
                pagamento.getValor(),
                pagamento.getValorOriginal(),
                pagamento.getValorAtualizado(),
                pagamento.getDataPagamento() != null ? pagamento.getDataPagamento().toString() : "",
                pagamento.getDataVencimento().toString(),
                pagamento.getStatus().toString(),
                pagamento.getObservacao(),
                pagamento.getNumeroParcela()
        );
    }
}
