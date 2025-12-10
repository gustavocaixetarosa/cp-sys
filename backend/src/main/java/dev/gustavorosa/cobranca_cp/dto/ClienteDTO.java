package dev.gustavorosa.cobranca_cp.dto;

import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.model.Contrato;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record ClienteDTO(
        Long id,
        @NotBlank(message = "Nome do cliente nao pode estar vazio.") String nome,
        String endereco,
        String telefone,
        LocalDate dataContrato,
        @NotBlank(message = "Cliente deve ter cpf ou cnpj") String registro,
        String banco,
        List<Contrato> contratos
) {
    public ClienteDTO(Cliente novoCliente) {
        this(
                novoCliente.getId(),
                novoCliente.getNome(),
                novoCliente.getEndereco(),
                novoCliente.getTelefone(),
                novoCliente.getDataVencimentoContrato(),
                novoCliente.getRegistro(),
                novoCliente.getBanco(),
                novoCliente.getContratos()
        );
    }
}
