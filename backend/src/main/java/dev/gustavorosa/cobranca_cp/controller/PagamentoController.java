package dev.gustavorosa.cobranca_cp.controller;

import dev.gustavorosa.cobranca_cp.dto.PagamentoDTO;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.service.PagamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pagamentos")
@CrossOrigin(origins = "http://localhost:4200")
public class PagamentoController {

    @Autowired
    private PagamentoService pagamentoService;

    @GetMapping
    public ResponseEntity<List<PagamentoDTO>> recuperarPagamentos(){
       List<Pagamento> pagamentosRecuperados = pagamentoService.recuperarTodos();
       List<PagamentoDTO> dtos = pagamentosRecuperados.stream().map(PagamentoDTO::new).toList();
       return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PagamentoDTO> atualizarPagamento(@RequestBody PagamentoDTO dto, @PathVariable Long id){
        System.out.println("Comecando atualizacao");
       Pagamento atualizado = this.pagamentoService.atualizarPagamento(dto, id);
       System.out.println("Atualizando pagamento " + id);
       return ResponseEntity.ok(new PagamentoDTO(atualizado));
    }
}
