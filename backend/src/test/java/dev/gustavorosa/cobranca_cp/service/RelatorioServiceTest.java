package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.RelatorioRequestDTO;
import dev.gustavorosa.cobranca_cp.dto.RelatorioResponseDTO;
import dev.gustavorosa.cobranca_cp.model.Cliente;
import dev.gustavorosa.cobranca_cp.model.Contrato;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.model.SituacaoPagamento;
import dev.gustavorosa.cobranca_cp.repository.ClienteRepository;
import dev.gustavorosa.cobranca_cp.repository.PagamentoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RelatorioServiceTest {

    @Mock
    private PagamentoRepository pagamentoRepository;

    @Mock
    private ClienteRepository clienteRepository;

    @InjectMocks
    private RelatorioService relatorioService;

    private Cliente cliente;
    private Contrato contrato;
    private List<Pagamento> pagamentos;
    private LocalDate dataInicio;
    private LocalDate dataFim;

    @BeforeEach
    void setUp() {
        // Setup test data
        cliente = Cliente.builder()
                .id(1L)
                .nome("Cliente Teste")
                .telefone("123456789")
                .registro("REG001")
                .build();

        contrato = Contrato.builder()
                .id(1L)
                .cliente(cliente)
                .valorContrato(10000.0)
                .duracaoEmMeses(10)
                .build();

        dataInicio = LocalDate.of(2024, 1, 1);
        dataFim = LocalDate.of(2024, 12, 31);

        pagamentos = new ArrayList<>();

        // Create test payments with different statuses
        // 2 paid on time (before due date)
        pagamentos.add(createPagamento(1L, 1000.0, LocalDate.of(2024, 1, 10), LocalDate.of(2024, 1, 5), SituacaoPagamento.PAGO));
        pagamentos.add(createPagamento(2L, 1000.0, LocalDate.of(2024, 2, 10), LocalDate.of(2024, 2, 8), SituacaoPagamento.PAGO));

        // 1 paid late
        pagamentos.add(createPagamento(3L, 1000.0, LocalDate.of(2024, 3, 10), LocalDate.of(2024, 3, 15), SituacaoPagamento.PAGO_COM_ATRASO));

        // 2 overdue
        pagamentos.add(createPagamento(4L, 1000.0, LocalDate.of(2024, 4, 10), null, SituacaoPagamento.ATRASADO));
        pagamentos.add(createPagamento(5L, 1000.0, LocalDate.of(2024, 5, 10), null, SituacaoPagamento.ATRASADO));

        // 5 open (not yet due)
        for (int i = 6; i <= 10; i++) {
            pagamentos.add(createPagamento((long) i, 1000.0, LocalDate.of(2024, i, 10), null, SituacaoPagamento.EM_ABERTO));
        }
    }

    private Pagamento createPagamento(Long id, Double valor, LocalDate dataVencimento, LocalDate dataPagamento, SituacaoPagamento status) {
        return Pagamento.builder()
                .id(id)
                .contrato(contrato)
                .valor(valor)
                .dataVencimento(dataVencimento)
                .dataPagamento(dataPagamento)
                .status(status)
                .numeroParcela(id.intValue())
                .build();
    }

    @Test
    void testGerarRelatorioTodosClientes() {
        // Arrange
        RelatorioRequestDTO request = new RelatorioRequestDTO(dataInicio, dataFim, null);
        when(pagamentoRepository.findByDataVencimentoBetween(any(), any())).thenReturn(pagamentos);

        // Act
        RelatorioResponseDTO response = relatorioService.gerarRelatorio(request);

        // Assert
        assertNotNull(response);
        assertEquals("Todos os clientes", response.nomeCliente());
        assertEquals(10, response.totalPagamentos());
        
        // Check overdue statistics
        assertEquals(2, response.quantidadeInadimplentes());
        assertEquals(20.0, response.percentualInadimplencia(), 0.01);
        
        // Check early payment statistics (2 out of 10 = 20%)
        assertEquals(2, response.quantidadePagosAntecipados());
        assertEquals(20.0, response.percentualPagosAntecipados(), 0.01);
        
        // Check financial totals
        assertEquals(3000.0, response.valorTotalRecebido(), 0.01); // 2 paid + 1 paid late
        assertEquals(7000.0, response.valorTotalEmAberto(), 0.01); // 2 overdue + 5 open
        
        // Check status counts
        assertEquals(3, response.quantidadePagos()); // PAGO + PAGO_COM_ATRASO
        assertEquals(2, response.quantidadeAtrasados());
        assertEquals(5, response.quantidadeEmAberto());
    }

    @Test
    void testGerarRelatorioClienteEspecifico() {
        // Arrange
        RelatorioRequestDTO request = new RelatorioRequestDTO(dataInicio, dataFim, 1L);
        when(clienteRepository.findById(1L)).thenReturn(Optional.of(cliente));
        when(pagamentoRepository.findByClienteIdAndDataVencimentoBetween(any(), any(), any())).thenReturn(pagamentos);

        // Act
        RelatorioResponseDTO response = relatorioService.gerarRelatorio(request);

        // Assert
        assertNotNull(response);
        assertEquals("Cliente Teste", response.nomeCliente());
        assertEquals(1L, response.clienteId());
        assertEquals(10, response.totalPagamentos());
    }

    @Test
    void testGerarRelatorioClienteNaoEncontrado() {
        // Arrange
        RelatorioRequestDTO request = new RelatorioRequestDTO(dataInicio, dataFim, 999L);
        when(clienteRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            relatorioService.gerarRelatorio(request);
        });
    }

    @Test
    void testGerarRelatorioDataInicioNull() {
        // Arrange
        RelatorioRequestDTO request = new RelatorioRequestDTO(null, dataFim, null);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            relatorioService.gerarRelatorio(request);
        });
    }

    @Test
    void testGerarRelatorioDataFimNull() {
        // Arrange
        RelatorioRequestDTO request = new RelatorioRequestDTO(dataInicio, null, null);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            relatorioService.gerarRelatorio(request);
        });
    }

    @Test
    void testGerarRelatorioDataInicioDepoisDataFim() {
        // Arrange
        RelatorioRequestDTO request = new RelatorioRequestDTO(dataFim, dataInicio, null);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            relatorioService.gerarRelatorio(request);
        });
    }

    @Test
    void testGerarRelatorioSemPagamentos() {
        // Arrange
        RelatorioRequestDTO request = new RelatorioRequestDTO(dataInicio, dataFim, null);
        when(pagamentoRepository.findByDataVencimentoBetween(any(), any())).thenReturn(new ArrayList<>());

        // Act
        RelatorioResponseDTO response = relatorioService.gerarRelatorio(request);

        // Assert
        assertNotNull(response);
        assertEquals(0, response.totalPagamentos());
        assertEquals(0, response.quantidadeInadimplentes());
        assertEquals(0.0, response.percentualInadimplencia());
        assertEquals(0, response.quantidadePagosAntecipados());
        assertEquals(0.0, response.percentualPagosAntecipados());
        assertEquals(0.0, response.valorTotalRecebido());
        assertEquals(0.0, response.valorTotalEmAberto());
    }
}
