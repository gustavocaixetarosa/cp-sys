package dev.gustavorosa.cobranca_cp.dto;

import java.time.LocalDate;

public record RelatorioRequestDTO(
    LocalDate dataInicio, 
    LocalDate dataFim,
    Long clienteId  // Optional: filter by specific client
){
}
