package dev.gustavorosa.cobranca_cp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import dev.gustavorosa.cobranca_cp.dto.ContratoDTO;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "CONTRATOS")
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
    private List<Pagamento> pagamentos;


    public Contrato() {
        super();
    }

    public Contrato(ContratoDTO dto, Cliente cliente){
        this.cliente = cliente;
        this.nomeContratante = dto.nomeContratante();
        this.cpfContratante = dto.cpfContratante();
        this.duracaoEmMeses = dto.duracaoEmMeses();
        this.dataInicioContrato = dto.dataInicioContrato();
        this.valorContrato = dto.valorContrato();
        this.pagamentos = new ArrayList<>();
    }

    public Contrato(Long id, Cliente cliente, String nomeContratante, String cpfContratante,
                    LocalDate data, Double valorContrato, List<Pagamento> pagamentos) {
        this.id = id;
        this.cliente = cliente;
        this.nomeContratante = nomeContratante;
        this.cpfContratante = cpfContratante;
        this.dataInicioContrato = data;
        this.valorContrato = valorContrato;
        this.pagamentos = pagamentos;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public @NotBlank String getNomeContratante() {
        return nomeContratante;
    }

    public void setNomeContratante(@NotBlank String nomeContratante) {
        this.nomeContratante = nomeContratante;
    }

    public String getCpfContratante() {
        return cpfContratante;
    }

    public void setCpfContratante(String cpfContratante) {
        this.cpfContratante = cpfContratante;
    }

    public Integer getDuracaoEmMeses() {
        return duracaoEmMeses;
    }

    public void setDuracaoEmMeses(Integer duracaoEmMeses) {
        this.duracaoEmMeses = duracaoEmMeses;
    }

    public LocalDate getDataInicioContrato() {
        return dataInicioContrato;
    }

    public void setDataInicioContrato(LocalDate dataInicioContrato) {
        this.dataInicioContrato = dataInicioContrato;
    }

    public Double getValorContrato() {
        return valorContrato;
    }

    public void setValorContrato(Double valorContrato) {
        this.valorContrato = valorContrato;
    }

    public List<Pagamento> getPagamentos() {
        return pagamentos;
    }

    public void setPagamentos(List<Pagamento> pagamentos) {
        this.pagamentos = pagamentos;
    }
}
