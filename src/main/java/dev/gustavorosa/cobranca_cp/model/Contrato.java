package dev.gustavorosa.cobranca_cp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import dev.gustavorosa.cobranca_cp.dto.ContratoDTO;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "CONTRATOS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private Cliente cliente;
    @NotBlank private String nomeContratante;
    private String cpfContratante;
    private Integer duracaoEmMeses;
    private LocalDate dataInicioContrato;
    private Double valorContrato;
    @OneToMany(mappedBy = "contrato", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Pagamento> pagamentos = new ArrayList<>();
}
