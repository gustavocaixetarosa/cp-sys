package dev.gustavorosa.cobranca_cp.repository;

import dev.gustavorosa.cobranca_cp.model.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {
}
