package dev.gustavorosa.cobranca_cp.repository;

import dev.gustavorosa.cobranca_cp.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    List<Pagamento> findByDataVencimentoBeforeAndDataPagamentoIsNull(LocalDate data);

    List<Pagamento> findByContratoClienteId(Long clienteId);
    
    // Find all payments with due date in a period
    List<Pagamento> findByDataVencimentoBetween(LocalDate inicio, LocalDate fim);
    
    // Find all payments for a specific client with due date in a period
    @Query("SELECT p FROM Pagamento p WHERE p.contrato.cliente.id = :clienteId AND p.dataVencimento BETWEEN :inicio AND :fim")
    List<Pagamento> findByClienteIdAndDataVencimentoBetween(
        @Param("clienteId") Long clienteId, 
        @Param("inicio") LocalDate inicio, 
        @Param("fim") LocalDate fim
    );
}
