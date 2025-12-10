package dev.gustavorosa.cobranca_cp.dto;

import dev.gustavorosa.cobranca_cp.model.Contrato;

import java.time.LocalDate;

public record ContratoDetailsDTO(
        Long contrato_id,
        Long cliente_id,
        Integer duracao_em_meses,
        String cpf_contratante,
        String nome_contratante,
        LocalDate data,
        Double valor_contrato
) {

    public ContratoDetailsDTO(Contrato contrato){
        this(
                contrato.getId(),
                contrato.getCliente().getId(),
                contrato.getDuracaoEmMeses(),
                contrato.getCpfContratante(),
                contrato.getNomeContratante(),
                contrato.getDataInicioContrato(),
                contrato.getValorContrato());
    }
}
