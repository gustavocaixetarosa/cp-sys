package dev.gustavorosa.cobranca_cp.controller;

import dev.gustavorosa.cobranca_cp.dto.ContratoDTO;
import dev.gustavorosa.cobranca_cp.dto.ContratoDetailsDTO;
import dev.gustavorosa.cobranca_cp.model.Contrato;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.service.ContratoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/contratos")
@CrossOrigin(origins = "http://localhost:4200")
public class ContratoController {

    @Autowired
    private ContratoService contratoService;

    @PostMapping
    public ResponseEntity<ContratoDetailsDTO> registrarContrato(@RequestBody ContratoDTO contratoDTO){
        Contrato novoContrato = contratoService.registrarContrato(contratoDTO);

        URI localNovoContrato = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(novoContrato.getId())
                .toUri();

        return ResponseEntity.created(localNovoContrato).body(new ContratoDetailsDTO(novoContrato));
    }

    @GetMapping
    public ResponseEntity<List<ContratoDetailsDTO>> recuperarContratos(){
        List<Contrato> todosContratos = contratoService.recuperarContratos();
        List<ContratoDetailsDTO> respostaDTO = todosContratos.stream().map(ContratoDetailsDTO::new).toList();
        return ResponseEntity.ok(respostaDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContratoDetailsDTO> recuperarContratoPorId(@PathVariable Long id){
        Contrato contrato = contratoService.recuperarContratoPorId(id);
        ContratoDetailsDTO contratoResposta = new ContratoDetailsDTO(contrato);
        return ResponseEntity.ok(contratoResposta);
    }
}
