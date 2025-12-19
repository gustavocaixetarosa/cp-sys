package dev.gustavorosa.cobranca_cp.util;

public class StringUtils {

    /**
     * Converte uma string para Title Case (primeira letra de cada palavra maiúscula,
     * restante minúscula).
     * Exemplo: "JOÃO DA SILVA" -> "João Da Silva"
     *          "maria santos" -> "Maria Santos"
     */
    public static String toTitleCase(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        StringBuilder result = new StringBuilder();
        String[] words = input.trim().toLowerCase().split("\\s+");

        for (int i = 0; i < words.length; i++) {
            if (!words[i].isEmpty()) {
                result.append(Character.toUpperCase(words[i].charAt(0)));
                if (words[i].length() > 1) {
                    result.append(words[i].substring(1));
                }
                if (i < words.length - 1) {
                    result.append(" ");
                }
            }
        }

        return result.toString();
    }
}

