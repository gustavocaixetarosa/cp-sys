package dev.gustavorosa.cobranca_cp.model;

import dev.gustavorosa.cobranca_cp.dto.ClienteDTO;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "CLIENTES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private String nome;
    private String endereco;
    @NotNull
    private String telefone;
    private LocalDate dataVencimentoContrato;
    @NotNull
    private String registro;
    private String banco;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Contrato> contratos = new ArrayList<>();

    public Cliente toModel(ClienteDTO clienteDTO) {
        return Cliente.builder()
        .id(clienteDTO.id())
        .nome(clienteDTO.nome())
        .endereco(clienteDTO.endereco())
        .telefone(clienteDTO.telefone())
        .dataVencimentoContrato(clienteDTO.dataContrato())
        .registro(clienteDTO.registro())
        .banco(clienteDTO.banco())
        .contratos(clienteDTO.contratos())
        .build();
    }
}
