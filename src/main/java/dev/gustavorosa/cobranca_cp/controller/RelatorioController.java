package dev.gustavorosa.cobranca_cp.controller;

import dev.gustavorosa.cobranca_cp.dto.RelatorioRequestDTO;
import dev.gustavorosa.cobranca_cp.dto.RelatorioResponseDTO;
import dev.gustavorosa.cobranca_cp.repository.ContratoRepository;
import dev.gustavorosa.cobranca_cp.service.RelatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {


    @Autowired
    private RelatorioService relatorioService;
    @Autowired
    private ContratoRepository contratoRepository;

//    @PostMapping("/clientes/{idCliente}")
//    public ResponseEntity<RelatorioResponseDTO> gerarRelatorioDeCliente(@PathVariable Long idCliente, @RequestBody RelatorioRequestDTO request){
//        File relatorioPdf = relatorioService.relatorioDoCliente(idCliente, request);
//        return new ResponseEntity<>(new RelatorioResponseDTO(relatorioPdf));
//    }

    @PostMapping("/clientes/{idCliente}")
    public ResponseEntity<byte[]> gerarRelatorioDeCliente(
            @PathVariable Long idCliente,
            @RequestBody RelatorioRequestDTO request) throws IOException {

        File relatorioPdf = relatorioService.relatorioDoCliente(idCliente, request);

        byte[] pdfBytes = Files.readAllBytes(relatorioPdf.toPath());

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + relatorioPdf.getName())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
