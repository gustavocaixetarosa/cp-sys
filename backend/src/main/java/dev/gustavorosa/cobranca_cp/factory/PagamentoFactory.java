package dev.gustavorosa.cobranca_cp.factory;

import dev.gustavorosa.cobranca_cp.dto.PagamentoDTO;
import dev.gustavorosa.cobranca_cp.model.Contrato;
import dev.gustavorosa.cobranca_cp.model.Pagamento;
import dev.gustavorosa.cobranca_cp.model.SituacaoPagamento;
import dev.gustavorosa.cobranca_cp.repository.ContratoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class PagamentoFactory {

    @Autowired
    private ContratoRepository contratoRepository;

    public Pagamento fromDTO(PagamentoDTO dto){
        LocalDate dataPagamento = null;
        if(!dto.data_pagamento().isEmpty()){
            System.out.println("Data de pagamento : " + dto.data_pagamento());
            dataPagamento = converteDate(dto.data_pagamento());
        }
        LocalDate dataVencimento = converteDate(dto.data_vencimento());

        Contrato contrato = contratoRepository.findById(dto.contrato_id())
                .orElseThrow(() -> new RuntimeException("Contrato nao encontrado"));

        return new Pagamento(
                dto.contrato_id(),
                contrato,
                dto.valor(),
                dataVencimento,
                dataPagamento,
                SituacaoPagamento.valueOf(dto.status()),
                dto.observacao(),
                dto.numero_parcela()
        );
    }

    private LocalDate converteDate(String s) {
        String[] pedacos = s.split("-");
        int ano = Integer.parseInt(pedacos[0]);
        int mes = Integer.parseInt(pedacos[1]);
        int dia = Integer.parseInt(pedacos[2]);
        return LocalDate.of(ano, mes, dia);
    }
}
