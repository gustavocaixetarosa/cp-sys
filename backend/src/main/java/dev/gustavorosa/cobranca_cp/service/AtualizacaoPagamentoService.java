package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.infra.AtualizacaoSituacaoPagamento;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.model.SituacaoPagamento;
import dev.gustavorosa.cobranca_cp.repository.AtualizacaoRepository;
import dev.gustavorosa.cobranca_cp.repository.PagamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AtualizacaoPagamentoService {

    private final PagamentoRepository pagamentoRepository;
    private final AtualizacaoRepository atualizacaoRepository;

    @Autowired
    public AtualizacaoPagamentoService(PagamentoRepository pagamentoRepository, AtualizacaoRepository atualizacaoRepository) {
        this.pagamentoRepository = pagamentoRepository;
        this.atualizacaoRepository = atualizacaoRepository;
    }

    @Transactional
    public void atualizarSituacaoSeNecessario() {
        LocalDate hoje = LocalDate.now();

        AtualizacaoSituacaoPagamento atualizacao = atualizacaoRepository.findById("situacao-pagamento")
                .orElse(new AtualizacaoSituacaoPagamento());

        if (hoje.equals(atualizacao.getDataUltimaAtualizacao())) {
            System.out.println("Atualização já realizada hoje.");
            return;
        }

        System.out.println("Iniciando atualização de situação dos pagamentos...");

        List<Pagamento> pagamentosAtrasados = pagamentoRepository
                .findByDataVencimentoBeforeAndDataPagamentoIsNull(hoje);

        pagamentosAtrasados.forEach(p -> p.setStatus(SituacaoPagamento.ATRASADO));

        pagamentoRepository.saveAll(pagamentosAtrasados);

        atualizacao.setDataUltimaAtualizacao(hoje);
        atualizacaoRepository.save(atualizacao);

        System.out.println("Atualização concluída em " + LocalDateTime.now());
    }
}
