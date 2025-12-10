package dev.gustavorosa.cobranca_cp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import dev.gustavorosa.cobranca_cp.dto.PagamentoDTO;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Map;

@Entity
@Table(name = "PAGAMENTOS")
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contrato_id", nullable = false)
    private Contrato contrato;
    private Double valor;
    private LocalDate dataVencimento;
    private LocalDate dataPagamento;
    @Enumerated(EnumType.STRING)
    private SituacaoPagamento status;
    private String observacao;
    private Integer numeroParcela;

    public Pagamento() {
    }

    public Pagamento(Long id, Contrato contrato, Double valor, LocalDate dataVencimento,
                     LocalDate dataPagamento, SituacaoPagamento status, String observacao, Integer numeroParcela) {
        this.id = id;
        this.contrato = contrato;
        this.valor = valor;
        this.dataVencimento = dataVencimento;
        this.dataPagamento = dataPagamento;
        this.status = status;
        this.observacao = observacao;
        this.numeroParcela = numeroParcela;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getValor() {
        return valor;
    }

    public void setValor(Double valor) {
        this.valor = valor;
    }

    public LocalDate getDataVencimento() {
        return dataVencimento;
    }

    public void setDataVencimento(LocalDate dataVencimento) {
        this.dataVencimento = dataVencimento;
    }

    public String getDataPagamento() {
        return dataPagamento != null ? dataPagamento.toString() : "";
    }

    public boolean foiPagoComAtraso(){
        if(this.dataPagamento == null){
            return false;
        }
        return this.dataPagamento.isAfter(this.dataVencimento);
    }

    public boolean dataVencimentoDentroDePeriodo(LocalDate inicio, LocalDate fim){
        if (this.getDataVencimento() == null) return false;
        return (!this.getDataVencimento().isBefore(inicio)) &&
                (!this.getDataVencimento().isAfter(fim));
    }

    public void setDataPagamento(LocalDate dataPagamento) {
        this.dataPagamento = dataPagamento;
    }

    public SituacaoPagamento getStatus() {
        return status;
    }

    public void setStatus(SituacaoPagamento status) {
        this.status = status;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }

    public Contrato getContrato() {
        return contrato;
    }

    public void setContrato(Contrato contrato) {
        this.contrato = contrato;
    }

    public Integer getNumeroParcela() {
        return numeroParcela;
    }

    public void setNumeroParcela(Integer numeroParcela) {
        this.numeroParcela = numeroParcela;
    }

    @Override
    public String toString() {
        return "Pagamento{" +
                "id=" + id +
                ", contrato=" + contrato +
                ", valor=" + valor +
                ", dataVencimento=" + dataVencimento +
                ", dataPagamento=" + dataPagamento +
                ", status=" + status +
                ", observacao='" + observacao + '\'' +
                ", numeroParcela=" + numeroParcela +
                '}';
    }

    public void atualizar(PagamentoDTO pagamento) {
        if(pagamento.data_pagamento() != null){
            this.dataPagamento = converteDate(pagamento.data_pagamento());
        }
        LocalDate novaDataVencimento = converteDate(pagamento.data_vencimento());
        if(this.dataVencimento != novaDataVencimento){
            this.dataVencimento = novaDataVencimento;
        }
        verificarStatus();
    }

    public void verificarStatus() {
        if(this.dataPagamento == null && this.dataVencimento.isBefore(LocalDate.now())){
            this.status = SituacaoPagamento.ATRASADO;
        } else if(this.dataPagamento != null){
            if(this.dataPagamento.isBefore(this.dataVencimento) || this.dataPagamento.isEqual(this.dataVencimento)) this.status = SituacaoPagamento.PAGO;
            else if(this.dataPagamento.isAfter(this.dataVencimento)) this.status = SituacaoPagamento.PAGO_COM_ATRASO;
        } else {
            this.status = SituacaoPagamento.EM_ABERTO;
        }
    }

    private LocalDate converteDate(String s) {
        String[] pedacos = s.split("-");
        System.out.println(Arrays.toString(pedacos));
        int ano = Integer.parseInt(pedacos[0]);
        int mes = Integer.parseInt(pedacos[1]);
        int dia = Integer.parseInt(pedacos[2]);
        return LocalDate.of(ano, mes, dia);
    }
}
