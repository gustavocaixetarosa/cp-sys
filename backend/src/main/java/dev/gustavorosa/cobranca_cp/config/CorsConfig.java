package dev.gustavorosa.cobranca_cp.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Configuration
public class CorsConfig implements WebMvcConfigurer{

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
      log.info("Configurando CORS para frontend: {}", frontendUrl);
      
      // Adicionar variações do domínio (com e sem www, http e https)
      String domain = frontendUrl.replace("https://", "").replace("http://", "");
      String wwwDomain = domain.startsWith("www.") ? domain : "www." + domain;
      
      registry.addMapping("/**")
        .allowedOriginPatterns(
          frontendUrl,
          "https://" + domain,
          "https://" + wwwDomain,
          "http://" + domain,
          "http://" + wwwDomain,
          "http://localhost:*",
          "http://127.0.0.1:*",
          "https://localhost:*",
          "https://127.0.0.1:*"
        )
        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);
      
      log.info("CORS configurado para: {}", domain);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        String domain = frontendUrl.replace("https://", "").replace("http://", "");
        String wwwDomain = domain.startsWith("www.") ? domain : "www." + domain;
        
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            frontendUrl,
            "https://" + domain,
            "https://" + wwwDomain,
            "http://" + domain,
            "http://" + wwwDomain,
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://localhost:*",
            "https://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        log.info("CorsConfigurationSource configurado para Spring Security");
        return source;
    }
}
