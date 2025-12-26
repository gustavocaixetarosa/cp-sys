package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.ClienteDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.repository.ClienteRepository;
import dev.gustavorosa.cobranca_cp.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    public Cliente registraCliente(ClienteDTO clienteDTO){
        Cliente novoCliente = clienteDTO.toModel();
        novoCliente.setNome(StringUtils.toTitleCase(novoCliente.getNome()));
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

    public Cliente atualizarCliente(Long id, ClienteDTO clienteDTO) {
        Cliente clienteExistente = recuperarPorId(id);
        
        // Atualiza os campos do cliente existente com os dados do DTO
        clienteExistente.setNome(StringUtils.toTitleCase(clienteDTO.nome()));
        clienteExistente.setEndereco(clienteDTO.endereco());
        clienteExistente.setTelefone(clienteDTO.telefone());
        clienteExistente.setRegistro(clienteDTO.registro());
        clienteExistente.setBanco(clienteDTO.banco());
        if (clienteDTO.dataContrato() != null) {
            clienteExistente.setDataVencimentoContrato(clienteDTO.dataContrato());
        }
        clienteExistente.setTaxaMulta(clienteDTO.taxaMulta());
        clienteExistente.setTaxaJurosMensal(clienteDTO.taxaJurosMensal());
        
        return clienteRepository.save(clienteExistente);
    }

    public void excluirCliente(Long id) {
        recuperarPorId(id);
        clienteRepository.deleteById(id);
    }
}
