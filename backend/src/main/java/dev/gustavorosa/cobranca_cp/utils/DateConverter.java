package dev.gustavorosa.cobranca_cp.utils;

import java.time.LocalDate;

public class DateConverter {

    public static LocalDate converteDate(String s) {
        String[] pedacos = s.split("-");
        int ano = Integer.parseInt(pedacos[0]);
        int mes = Integer.parseInt(pedacos[1]);
        int dia = Integer.parseInt(pedacos[2]);
        return LocalDate.of(ano, mes, dia);
    }}
