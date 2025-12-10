package dev.gustavorosa.cobranca_cp.repository;

import dev.gustavorosa.cobranca_cp.infra.AtualizacaoSituacaoPagamento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AtualizacaoRepository extends JpaRepository<AtualizacaoSituacaoPagamento, String> {
}
