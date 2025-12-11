package dev.gustavorosa.cobranca_cp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequest {
    @NotBlank(message = "Refresh token é obrigatório")
    private String refreshToken;
}

