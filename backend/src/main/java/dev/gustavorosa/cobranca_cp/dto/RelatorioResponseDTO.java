package dev.gustavorosa.cobranca_cp.dto;

import java.time.LocalDate;

public record RelatorioResponseDTO(
    // Period information
    LocalDate dataInicio,
    LocalDate dataFim,
    Long clienteId,
    String nomeCliente,
    
    // Overdue payments statistics
    Integer quantidadeInadimplentes,
    Double percentualInadimplencia,
    
    // Early payments statistics
    Integer quantidadePagosAntecipados,
    Double percentualPagosAntecipados,
    
    // Financial totals
    Double valorTotalRecebido,
    Double valorTotalEmAberto,
    
    // Additional context
    Integer totalPagamentos,
    Integer quantidadePagos,
    Integer quantidadeAtrasados,
    Integer quantidadeEmAberto
){
}
