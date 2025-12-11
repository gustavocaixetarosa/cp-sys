package dev.gustavorosa.cobranca_cp.infra;

import dev.gustavorosa.cobranca_cp.model.Role;
import dev.gustavorosa.cobranca_cp.model.Usuario;
import dev.gustavorosa.cobranca_cp.repository.UsuarioRepository;
import dev.gustavorosa.cobranca_cp.service.AtualizacaoPagamentoService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class Inicializador {

    private final AtualizacaoPagamentoService atualizacaoPagamentoService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public Inicializador(AtualizacaoPagamentoService atualizacaoPagamentoService,
                        UsuarioRepository usuarioRepository,
                        PasswordEncoder passwordEncoder) {
        this.atualizacaoPagamentoService = atualizacaoPagamentoService;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void aoIniciarAplicacao() {
        atualizacaoPagamentoService.atualizarSituacaoSeNecessario();
        criarUsuarioAdminPadrao();
    }
    
    private void criarUsuarioAdminPadrao() {
        String emailAdmin = "admin@cobranca.com";
        
        if (!usuarioRepository.existsByEmail(emailAdmin)) {
            Usuario admin = Usuario.builder()
                    .nome("Administrador")
                    .email(emailAdmin)
                    .senha(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .ativo(true)
                    .build();
            
            usuarioRepository.save(admin);
            log.info("========================================");
            log.info("Usuário admin padrão criado!");
            log.info("Email: {}", emailAdmin);
            log.info("Senha: admin123");
            log.info("⚠️  ALTERE A SENHA EM PRODUÇÃO!");
            log.info("========================================");
        }
    }
}

