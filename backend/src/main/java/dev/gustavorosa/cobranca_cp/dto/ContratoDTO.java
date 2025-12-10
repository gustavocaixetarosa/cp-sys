package dev.gustavorosa.cobranca_cp.dto;

import dev.gustavorosa.cobranca_cp.model.Contrato;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ContratoDTO(
        @NotNull(message = "Id do cliente e obrigatorio.") Long clienteId,
        @NotBlank(message = "Nome do contratante e obrigatorio.") String nomeContratante,
        String cpfContratante,
        @NotNull(message = "Duracao do contrato e indispensavel.") Integer duracaoEmMeses,
        @NotNull(message = "Data do inicio do contrato e obrigatorio.") LocalDate dataInicioContrato,
        @NotNull(message = "Data da primeira parcela e obrigatorio") LocalDate dataPrimeiraParcela,
        @NotNull(message = "O valor do contrato e obrigatorio.")  Double valorContrato
) {
    public ContratoDTO(Contrato novoContrato) {
        this(
                novoContrato.getCliente().getId(),
                novoContrato.getNomeContratante(),
                novoContrato.getCpfContratante(),
                novoContrato.getDuracaoEmMeses(),
                null,
                novoContrato.getDataInicioContrato(),
                novoContrato.getValorContrato()
        );
    }
}
