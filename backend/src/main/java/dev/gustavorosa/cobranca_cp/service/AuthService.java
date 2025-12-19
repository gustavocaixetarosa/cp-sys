package dev.gustavorosa.cobranca_cp.service;

import dev.gustavorosa.cobranca_cp.dto.AuthResponse;
import dev.gustavorosa.cobranca_cp.dto.LoginRequest;
import dev.gustavorosa.cobranca_cp.dto.RegisterRequest;
import dev.gustavorosa.cobranca_cp.model.Role;
import dev.gustavorosa.cobranca_cp.model.Usuario;
import dev.gustavorosa.cobranca_cp.repository.UsuarioRepository;
import dev.gustavorosa.cobranca_cp.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getSenha())
        );
        
        Usuario usuario = (Usuario) authentication.getPrincipal();
        
        String token = tokenProvider.generateToken(usuario);
        String refreshToken = tokenProvider.generateRefreshToken(usuario);
        
        log.info("Login realizado com sucesso para usuário: {}", usuario.getEmail());
        
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .usuario(AuthResponse.UsuarioDTO.builder()
                        .id(usuario.getId())
                        .nome(usuario.getNome())
                        .email(usuario.getEmail())
                        .role(usuario.getRole())
                        .build())
                .build();
    }
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Verifica se email já existe
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }
        
        // Cria novo usuário
        Usuario usuario = Usuario.builder()
                .nome(request.getNome())
                .email(request.getEmail())
                .senha(passwordEncoder.encode(request.getSenha()))
                .role(Role.USER) // Novos usuários são USER por padrão
                .ativo(true)
                .build();
        
        usuario = usuarioRepository.save(usuario);
        
        // Gera tokens
        String token = tokenProvider.generateToken(usuario);
        String refreshToken = tokenProvider.generateRefreshToken(usuario);
        
        log.info("Novo usuário registrado: {}", usuario.getEmail());
        
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tipo("Bearer")
                .usuario(AuthResponse.UsuarioDTO.builder()
                        .id(usuario.getId())
                        .nome(usuario.getNome())
                        .email(usuario.getEmail())
                        .role(usuario.getRole())
                        .build())
                .build();
    }
    
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Refresh token inválido ou expirado");
        }
        
        String email = tokenProvider.getEmailFromToken(refreshToken);
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        String newToken = tokenProvider.generateToken(usuario);
        String newRefreshToken = tokenProvider.generateRefreshToken(usuario);
        
        log.info("Token renovado para usuário: {}", usuario.getEmail());
        
        return AuthResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .tipo("Bearer")
                .usuario(AuthResponse.UsuarioDTO.builder()
                        .id(usuario.getId())
                        .nome(usuario.getNome())
                        .email(usuario.getEmail())
                        .role(usuario.getRole())
                        .build())
                .build();
    }
}

