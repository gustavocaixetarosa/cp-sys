package dev.gustavorosa.cobranca_cp.dto;

import dev.gustavorosa.cobranca_cp.model.Cliente;

public record ClienteDetailsDTO(
        Long cliente_id,
        String nome,
        String endereco,
        String telefone,
        String registro,
        String banco
) {

    public ClienteDetailsDTO(Cliente clienteRecuperado) {
        this(clienteRecuperado.getId(), clienteRecuperado.getNome(), clienteRecuperado.getEndereco(),
                clienteRecuperado.getTelefone(), clienteRecuperado.getRegistro(), clienteRecuperado.getBanco());
    }
}
