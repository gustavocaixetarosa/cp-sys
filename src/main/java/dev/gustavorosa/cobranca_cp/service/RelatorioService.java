package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.RelatorioRequestDTO;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.repository.PagamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;
import java.util.Map;

@Service
public class RelatorioService {

    @Autowired
    private PagamentoRepository pagamentoRepository;

    public File relatorioDoCliente(Long idCliente, RelatorioRequestDTO datas) {
        //Captura todos os dados
        List<Pagamento> todosPagamentosDoCliente = pagamentoRepository.findByContratoClienteId(idCliente);

        //Calcula taxas e quantidades
        calculaInadimplencias(todosPagamentosDoCliente, datas);

        //Monta pdf

        //retorna pdf
        return new File();
    }

    private Map<String, Double> calculaInadimplencias(List<Pagamento> todosPagamentosDoCliente, RelatorioRequestDTO datas) {
        Double inadimplenciaHistorica = calcularPorcentagemAtrasada(todosPagamentosDoCliente);
        Double inadimplenciaPeriodo = getInadimplenciaPeriodo(todosPagamentosDoCliente, datas);
    }

    private Double getInadimplenciaPeriodo(List<Pagamento> todosPagamentosDoCliente, RelatorioRequestDTO datas) {
        List<Pagamento> pagamentosPeriodo = todosPagamentosDoCliente.stream().filter(p -> p.dataVencimentoDentroDePeriodo(datas.dataInicio(), datas.dataFim())).toList();
        return calcularPorcentagemAtrasada(pagamentosPeriodo);
    }

    private Double getInadimplenciaHistorica(List<Pagamento> todosPagamentosDoCliente) {
        return todosPagamentosDoCliente.isEmpty() ? 0.0 :
                (todosPagamentosDoCliente.stream().filter(Pagamento::foiPagoComAtraso).count() * 100.0)
                        / todosPagamentosDoCliente.size();
    }

    private Double calcularPorcentagemAtrasada(List<Pagamento> pagamentos) {
        return pagamentos.isEmpty() ? 0.0 :
                (pagamentos.stream().filter(Pagamento::foiPagoComAtraso).count() * 100.0) / pagamentos.size();
    }
}
