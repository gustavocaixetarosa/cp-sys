package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.PagamentoDTO;
import dev.gustavorosa.cobranca_cp.factory.PagamentoFactory;
import dev.gustavorosa.cobranca_cp.model.Contrato;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.model.SituacaoPagamento;
import dev.gustavorosa.cobranca_cp.repository.PagamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Month;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PagamentoService {

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private PagamentoFactory pagamentoFactory;

    public List<Pagamento> gerarPagamentosAutomaticos(Contrato novoContrato, LocalDate primeiraParcela){
        List<Pagamento> novosPagamentos = new ArrayList<>();
        List<LocalDate> todasDatasVencimento = gerarDatasVencimento(primeiraParcela, novoContrato.getDuracaoEmMeses());
        int numeroPagamento = 1;
        for (LocalDate data: todasDatasVencimento){
            novosPagamentos.add(gerarPagamento(novoContrato, data, numeroPagamento));
            numeroPagamento++;
        }
        return novosPagamentos;
    }

    private Pagamento gerarPagamento(Contrato novoContrato, LocalDate data, int numero) {
        Pagamento novoPagamento = new Pagamento(null, novoContrato, novoContrato.getValorContrato()/novoContrato.getDuracaoEmMeses(), data, null, null, null, numero);
        novoPagamento.verificarStatus();
        return novoPagamento;
    }

    private List<LocalDate> gerarDatasVencimento(LocalDate primeiraParcela, int numeroParcelas){
        List<LocalDate> datasVencimento = new ArrayList<>();
        for(int i = 0; i < numeroParcelas; i++){
            datasVencimento.add(primeiraParcela.plusMonths(i));
        }
        return datasVencimento;
    }

    @Transactional
    private void atualizarSituacaoPagamentos(){
        LocalDate dataHoje = LocalDate.now();
        List<Pagamento> pagamentosAtrasados = pagamentoRepository.findByDataVencimentoBeforeAndDataPagamentoIsNull(dataHoje);
        pagamentosAtrasados.forEach(p -> p.setStatus(SituacaoPagamento.ATRASADO));
        pagamentoRepository.saveAll(pagamentosAtrasados);
    }

    public List<Pagamento> recuperarTodos() {
        List<Pagamento> recuperados = this.pagamentoRepository.findAll();
        if(recuperados.isEmpty()){
            throw new RuntimeException("Nenhum pagamento encontrado");
        }
        return recuperados;

    }

    public Pagamento atualizarPagamento(PagamentoDTO dto, Long id) {
        Pagamento pagamento = this.pagamentoFactory.fromDTO(dto);
        Optional<Pagamento> pagamentoRecuperado = this.pagamentoRepository.findById(id);
        if(pagamentoRecuperado.isEmpty()) throw new RuntimeException("Pagamento nao encontrado");
        Pagamento pagamentoParaAtualizar = pagamentoRecuperado.get();
        pagamentoParaAtualizar.atualizar(dto);
        System.out.println("Pagamento atualizado: " + pagamentoParaAtualizar.getDataPagamento());
        this.pagamentoRepository.save(pagamentoParaAtualizar);

        return pagamentoParaAtualizar;
    }
}
