package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.ContratoDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.model.Contrato;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.repository.ContratoRepository;
import dev.gustavorosa.cobranca_cp.utils.DateConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ContratoService {

    @Autowired
    private ContratoRepository contratoRepository;

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private PagamentoService pagamentoService;

    public Contrato registrarContrato(ContratoDTO contratoDTO) {
        Cliente cliente = clienteService.recuperarPorId(contratoDTO.clienteId());
        Contrato novoContrato = new Contrato(contratoDTO, cliente);
        List<Pagamento> novosPagamentos = pagamentoService.gerarPagamentosAutomaticos(novoContrato, contratoDTO.dataPrimeiraParcela());
        novoContrato.setPagamentos(novosPagamentos);
        return contratoRepository.save(novoContrato);
    }

    public List<Contrato> recuperarContratos() {
        List<Contrato> todosContratos = contratoRepository.findAll();
        if(todosContratos.isEmpty()) throw new RuntimeException("Nenhum contrato encontrado.");
        return todosContratos;
    }

    public Contrato recuperarContratoPorId(Long id) {
        Optional<Contrato> contratoRecuperado = contratoRepository.findById(id);
        if(contratoRecuperado.isEmpty()) throw new RuntimeException("Contrato não encontrado.");
        return contratoRecuperado.get();
    }
}
