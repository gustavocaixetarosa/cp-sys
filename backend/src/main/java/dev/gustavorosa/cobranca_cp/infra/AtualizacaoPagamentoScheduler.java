package dev.gustavorosa.cobranca_cp.infra;

import dev.gustavorosa.cobranca_cp.service.AtualizacaoPagamentoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler responsável por executar a atualização diária de situação 
 * e valores dos pagamentos em atraso (multa e juros).
 */
@Slf4j
@Component
public class AtualizacaoPagamentoScheduler {

    private final AtualizacaoPagamentoService atualizacaoPagamentoService;

    @Autowired
    public AtualizacaoPagamentoScheduler(AtualizacaoPagamentoService atualizacaoPagamentoService) {
        this.atualizacaoPagamentoService = atualizacaoPagamentoService;
    }

    /**
     * Executa diariamente às 01:00 da manhã.
     * Cron: segundos minutos horas dia mês diaDaSemana
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void executarAtualizacaoDiaria() {
        log.info("Iniciando job de atualização diária de pagamentos...");
        try {
            atualizacaoPagamentoService.atualizarSituacaoSeNecessario();
            log.info("Job de atualização diária concluído com sucesso.");
        } catch (Exception e) {
            log.error("Erro ao executar job de atualização diária: {}", e.getMessage(), e);
        }
    }
}

