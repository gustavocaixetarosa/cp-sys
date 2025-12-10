package dev.gustavorosa.cobranca_cp.controller;

import dev.gustavorosa.cobranca_cp.dto.ClienteDTO;
import dev.gustavorosa.cobranca_cp.dto.ClienteDetailsDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/clientes")
@CrossOrigin(origins = "http://localhost:4200")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @PostMapping
    public ResponseEntity<ClienteDTO> registraCliente(@RequestBody ClienteDTO clienteDTO){
        System.out.println(clienteDTO);
        Cliente novoCliente = clienteService.registraCliente(clienteDTO);

        URI localNovoCliente = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(novoCliente.getId())
                .toUri();

        return ResponseEntity.created(localNovoCliente).body(new ClienteDTO(novoCliente));
    }

    @GetMapping
    public ResponseEntity<List<ClienteDetailsDTO>> recuperarClientes(){
        List<Cliente> todosClientes = clienteService.recuperarTodos();
        List<ClienteDetailsDTO> respostaDTO = todosClientes.stream().map(ClienteDetailsDTO::new).toList();
        return ResponseEntity.ok(respostaDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDetailsDTO> recuperarClientePorId(@PathVariable Long id){
        Cliente clienteRecuperado = clienteService.recuperarPorId(id);
        return ResponseEntity.ok(new ClienteDetailsDTO(clienteRecuperado));
    }

    @DeleteMapping("/{id}")
    public void excluirCliente(@PathVariable Long id){
        clienteService.excluirCliente(id);
    }
}
