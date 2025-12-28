package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.infra.AtualizacaoSituacaoPagamento;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.model.SituacaoPagamento;
import dev.gustavorosa.cobranca_cp.repository.AtualizacaoRepository;
import dev.gustavorosa.cobranca_cp.repository.PagamentoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
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
            log.info("Atualização já realizada hoje.");
            return;
        }

        log.info("Iniciando atualização de situação e valores dos pagamentos...");

        List<Pagamento> pagamentosAtrasados = pagamentoRepository
                .findByDataVencimentoBeforeAndDataPagamentoIsNull(hoje);

        for (Pagamento pagamento : pagamentosAtrasados) {
            // Atualiza status para ATRASADO
            pagamento.setStatus(SituacaoPagamento.ATRASADO);
            
            // Calcula e aplica multa e juros
            atualizarValorComMultaEJuros(pagamento, hoje);
        }

        pagamentoRepository.saveAll(pagamentosAtrasados);

        atualizacao.setDataUltimaAtualizacao(hoje);
        atualizacaoRepository.save(atualizacao);

        log.info("Atualização concluída em {}", LocalDateTime.now());
    }

    /**
     * Calcula e aplica multa (única vez) e juros simples diários.
     * Fórmula: valorAtualizado = valorOriginal * (1 + taxaMulta) + valorOriginal * (diasAtraso / 30) * taxaJurosMensal
     * 
     * Exemplo: Valor R$ 1000, Multa 2%, Juros 10% ao mês, 5 dias de atraso
     * - Multa: 1000 * 0.02 = R$ 20
     * - Juros: 1000 * (5/30) * 0.10 = R$ 16.67
     * - Total: 1000 + 20 + 16.67 = R$ 1036.67
     */
    private void atualizarValorComMultaEJuros(Pagamento pagamento, LocalDate hoje) {
        Cliente cliente = pagamento.getContrato().getCliente();
        
        Double taxaMulta = cliente.getTaxaMulta();
        Double taxaJurosMensal = cliente.getTaxaJurosMensal();
        
        // Se cliente não tem taxas configuradas, não atualiza valor
        if (taxaMulta == null && taxaJurosMensal == null) {
            return;
        }
        
        // Inicializa valorOriginal se ainda não foi definido
        if (pagamento.getValorOriginal() == null) {
            pagamento.setValorOriginal(pagamento.getValor());
        }
        
        Double valorOriginal = pagamento.getValorOriginal();
        Double valorFinal = valorOriginal;
        
        // Aplica multa (uma única vez) - percentual sobre o valor original
        if (taxaMulta != null && taxaMulta > 0) {
            Double multa = valorOriginal * taxaMulta;
            valorFinal += multa;
            
            if (!Boolean.TRUE.equals(pagamento.getMultaAplicada())) {
                pagamento.setMultaAplicada(true);
                log.info("Multa de {}% (R$ {}) aplicada ao pagamento {}", 
                        taxaMulta * 100, String.format("%.2f", multa), pagamento.getId());
            }
        }
        
        // Calcula juros simples diários
        // Fórmula: valorOriginal * (diasAtraso / 30) * taxaJurosMensal
        if (taxaJurosMensal != null && taxaJurosMensal > 0) {
            long diasAtraso = ChronoUnit.DAYS.between(pagamento.getDataVencimento(), hoje);
            
            if (diasAtraso > 0) {
                Double juros = valorOriginal * (diasAtraso / 30.0) * taxaJurosMensal;
                valorFinal += juros;
                log.info("Juros simples de {}% ao mês aplicados ao pagamento {} ({} dias = R$ {})", 
                        taxaJurosMensal * 100, pagamento.getId(), diasAtraso, String.format("%.2f", juros));
            }
        }
        
        // Arredonda para 2 casas decimais
        valorFinal = Math.round(valorFinal * 100.0) / 100.0;
        
        pagamento.setValorAtualizado(valorFinal);
        pagamento.setValor(valorFinal); // Atualiza o valor principal também
        pagamento.setDataUltimaAtualizacaoValor(hoje);
    }
}
