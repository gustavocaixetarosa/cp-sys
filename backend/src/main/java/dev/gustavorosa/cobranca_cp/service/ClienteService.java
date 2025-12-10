package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.ClienteDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    public Cliente registraCliente(ClienteDTO clienteDTO){
        Cliente novoCliente = new Cliente(clienteDTO);
        return clienteRepository.save(novoCliente);
    }

    public List<Cliente> recuperarTodos() {
        List<Cliente> todosClientes = clienteRepository.findAll();
        if(todosClientes.isEmpty())
            throw new RuntimeException("Nenhum cliente encontrado.");

        return todosClientes;
    }

    public Cliente recuperarPorId(Long id) {
        Optional<Cliente> cliente = clienteRepository.findById(id);
        if(cliente.isEmpty())
            throw new RuntimeException("Cliente com o id " + id + " nao encontrado.");
        return cliente.get();
    }

    public void excluirCliente(Long id) {
        recuperarPorId(id);
        clienteRepository.deleteById(id);
    }
}
