package dev.gustavorosa.cobranca_cp.controller;

import dev.gustavorosa.cobranca_cp.dto.RelatorioRequestDTO;
import dev.gustavorosa.cobranca_cp.dto.RelatorioResponseDTO;
import dev.gustavorosa.cobranca_cp.service.RelatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {

    @Autowired
    private RelatorioService relatorioService;

    @PostMapping
    public ResponseEntity<RelatorioResponseDTO> gerarRelatorio(@RequestBody RelatorioRequestDTO request) {
        try {
            RelatorioResponseDTO relatorio = relatorioService.gerarRelatorio(request);
            return ResponseEntity.ok(relatorio);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
