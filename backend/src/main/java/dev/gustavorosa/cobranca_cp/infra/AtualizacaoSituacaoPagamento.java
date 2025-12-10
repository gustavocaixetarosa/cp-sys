package dev.gustavorosa.cobranca_cp.infra;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.time.LocalDate;

@Entity
public class AtualizacaoSituacaoPagamento {

    @Id
    private String id = "situacao-pagamento";

    private LocalDate dataUltimaAtualizacao;

    public AtualizacaoSituacaoPagamento(){}

    public AtualizacaoSituacaoPagamento(LocalDate dataAtualizacao){
        this.dataUltimaAtualizacao = dataAtualizacao;
    }

    public String getId() {
        return id;
    }

    public LocalDate getDataUltimaAtualizacao() {
        return dataUltimaAtualizacao;
    }

    public void setDataUltimaAtualizacao(LocalDate dataUltimaAtualizacao) {
        this.dataUltimaAtualizacao = dataUltimaAtualizacao;
    }
}
