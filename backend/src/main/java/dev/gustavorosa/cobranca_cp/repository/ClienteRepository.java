package dev.gustavorosa.cobranca_cp.repository;

import dev.gustavorosa.cobranca_cp.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
