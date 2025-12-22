package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.RelatorioRequestDTO;
import dev.gustavorosa.cobranca_cp.dto.RelatorioResponseDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.model.SituacaoPagamento;
import dev.gustavorosa.cobranca_cp.repository.ClienteRepository;
import dev.gustavorosa.cobranca_cp.repository.PagamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class RelatorioService {

    @Autowired
    private PagamentoRepository pagamentoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    public RelatorioResponseDTO gerarRelatorio(RelatorioRequestDTO request) {
        // Validate dates
        if (request.dataInicio() == null || request.dataFim() == null) {
            throw new IllegalArgumentException("Data de início e fim são obrigatórias");
        }

        if (request.dataInicio().isAfter(request.dataFim())) {
            throw new IllegalArgumentException("Data de início deve ser anterior à data de fim");
        }

        // Get payments based on filter
        List<Pagamento> pagamentos;
        String nomeCliente = null;

        if (request.clienteId() != null) {
            // Filter by client
            pagamentos = pagamentoRepository.findByClienteIdAndDataVencimentoBetween(
                request.clienteId(), 
                request.dataInicio(), 
                request.dataFim()
            );
            
            // Get client name
            Optional<Cliente> cliente = clienteRepository.findById(request.clienteId());
            if (cliente.isEmpty()) {
                throw new IllegalArgumentException("Cliente não encontrado");
            }
            nomeCliente = cliente.get().getNome();
        } else {
            // All clients
            pagamentos = pagamentoRepository.findByDataVencimentoBetween(
                request.dataInicio(), 
                request.dataFim()
            );
            nomeCliente = "Todos os clientes";
        }

        // Calculate statistics
        return calcularEstatisticas(pagamentos, request, nomeCliente);
    }

    private RelatorioResponseDTO calcularEstatisticas(
        List<Pagamento> pagamentos, 
        RelatorioRequestDTO request,
        String nomeCliente
    ) {
        int totalPagamentos = pagamentos.size();

        // Count by status
        int quantidadePagos = 0;
        int quantidadeAtrasados = 0;
        int quantidadeEmAberto = 0;
        int quantidadePagosAntecipados = 0;

        // Sum values
        double valorTotalRecebido = 0.0;
        double valorTotalEmAberto = 0.0;

        for (Pagamento pagamento : pagamentos) {
            SituacaoPagamento status = pagamento.getStatus();

            // Count by status
            if (status == SituacaoPagamento.PAGO || status == SituacaoPagamento.PAGO_COM_ATRASO) {
                quantidadePagos++;
                valorTotalRecebido += pagamento.getValor();

                // Check if paid before due date
                if (pagamento.getDataPagamento() != null && 
                    pagamento.getDataPagamento().isBefore(pagamento.getDataVencimento())) {
                    quantidadePagosAntecipados++;
                }
            } else if (status == SituacaoPagamento.ATRASADO) {
                quantidadeAtrasados++;
                valorTotalEmAberto += pagamento.getValor();
            } else if (status == SituacaoPagamento.EM_ABERTO) {
                quantidadeEmAberto++;
                valorTotalEmAberto += pagamento.getValor();
            }
        }

        // Calculate percentages
        double percentualInadimplencia = totalPagamentos > 0 
            ? (quantidadeAtrasados * 100.0) / totalPagamentos 
            : 0.0;

        double percentualPagosAntecipados = totalPagamentos > 0 
            ? (quantidadePagosAntecipados * 100.0) / totalPagamentos 
            : 0.0;

        return new RelatorioResponseDTO(
            request.dataInicio(),
            request.dataFim(),
            request.clienteId(),
            nomeCliente,
            quantidadeAtrasados,
            percentualInadimplencia,
            quantidadePagosAntecipados,
            percentualPagosAntecipados,
            valorTotalRecebido,
            valorTotalEmAberto,
            totalPagamentos,
            quantidadePagos,
            quantidadeAtrasados,
            quantidadeEmAberto
        );
    }
}
