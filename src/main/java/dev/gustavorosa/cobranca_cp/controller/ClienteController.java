package dev.gustavorosa.cobranca_cp.controller;

import dev.gustavorosa.cobranca_cp.dto.ClienteDTO;
import dev.gustavorosa.cobranca_cp.dto.ClienteDetailsDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.service.ClienteService;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/clientes")
@CrossOrigin(origins = "http://localhost:5173")
@Slf4j
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @PostMapping
    public ResponseEntity<ClienteDTO> registraCliente(@RequestBody ClienteDTO clienteDTO){
        log.info("Entry [ClienteController.registraCliente] - Registrando cliente: {}", clienteDTO);
        Cliente novoCliente = clienteService.registraCliente(clienteDTO);

        URI localNovoCliente = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(novoCliente.getId())
                .toUri();

        log.info("Exit [ClienteController.registraCliente] - Cliente registrado com sucesso: {}", novoCliente);
        return ResponseEntity.created(localNovoCliente).body(new ClienteDTO(novoCliente));
    }

    @GetMapping
    public ResponseEntity<List<ClienteDetailsDTO>> recuperarClientes(){
        log.info("Entry [ClienteController.recuperarClientes] - Recuperando todos os clientes");
        List<Cliente> todosClientes = clienteService.recuperarTodos();
        List<ClienteDetailsDTO> respostaDTO = todosClientes.stream().map(ClienteDetailsDTO::new).toList();
        log.info("Exit [ClienteController.recuperarClientes] - Clientes recuperados com sucesso: {}", respostaDTO);
        return ResponseEntity.ok(respostaDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDetailsDTO> recuperarClientePorId(@PathVariable Long id){
        log.info("Entry [ClienteController.recuperarClientePorId] - Recuperando cliente por id: {}", id);
        Cliente clienteRecuperado = clienteService.recuperarPorId(id);
        log.info("Exit [ClienteController.recuperarClientePorId] - Cliente recuperado com sucesso: {}", clienteRecuperado);
        return ResponseEntity.ok(new ClienteDetailsDTO(clienteRecuperado));
    }

    @DeleteMapping("/{id}")
    public void excluirCliente(@PathVariable Long id){
        log.info("Entry [ClienteController.excluirCliente] - Excluindo cliente por id: {}", id);
        clienteService.excluirCliente(id);
        log.info("Exit [ClienteController.excluirCliente] - Cliente excluido com sucesso: {}", id);
    }
}
