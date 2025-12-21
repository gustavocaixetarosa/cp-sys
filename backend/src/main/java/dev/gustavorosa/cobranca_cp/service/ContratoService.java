package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.ContratoDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.model.Contrato;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.repository.ContratoRepository;
import dev.gustavorosa.cobranca_cp.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        Contrato novoContrato = contratoDTO.toModel(cliente);
        novoContrato.setNomeContratante(StringUtils.toTitleCase(novoContrato.getNomeContratante()));
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

    public Contrato atualizarContrato(Long id, ContratoDTO contratoDTO) {
        Contrato contratoExistente = recuperarContratoPorId(id);
        
        // Atualiza os campos do contrato existente
        contratoExistente.setNomeContratante(StringUtils.toTitleCase(contratoDTO.nomeContratante()));
        contratoExistente.setCpfContratante(contratoDTO.cpfContratante());
        contratoExistente.setDuracaoEmMeses(contratoDTO.duracaoEmMeses());
        contratoExistente.setValorContrato(contratoDTO.valorContrato());
        if (contratoDTO.dataInicioContrato() != null) {
            contratoExistente.setDataInicioContrato(contratoDTO.dataInicioContrato());
        }
        
        return contratoRepository.save(contratoExistente);
    }

    public void excluirContrato(Long id) {
        recuperarContratoPorId(id);
        contratoRepository.deleteById(id);
    }
}
