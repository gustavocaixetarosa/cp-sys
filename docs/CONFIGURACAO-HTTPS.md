# 🔒 Guia Completo: Configurar HTTPS na VPS

## Índice
1. [Por que usar HTTPS?](#por-que-usar-https)
2. [Pré-requisitos](#pré-requisitos)
3. [Opção 1: Nginx como Proxy Reverso (Recomendado)](#opção-1-nginx-como-proxy-reverso-recomendado)
4. [Opção 2: Traefik com Docker](#opção-2-traefik-com-docker)
5. [Renovação Automática](#renovação-automática)
6. [Troubleshooting](#troubleshooting)

---

## Por que usar HTTPS?

✅ **Segurança**: Criptografa dados entre navegador e servidor  
✅ **Autenticação**: Garante que o usuário está conectado ao servidor correto  
✅ **SEO**: Google prioriza sites HTTPS  
✅ **Confiança**: Navegadores mostram "cadeado" de segurança  
✅ **JWT**: Tokens não trafegam em texto plano  

⚠️ **Sem HTTPS**:
- Senhas e tokens podem ser interceptados
- Dados sensíveis expostos
- Navegadores alertam "Não seguro"

---

## Pré-requisitos

### 1. Domínio Próprio
Você precisa de um domínio apontando para sua VPS:

```bash
# Exemplo de configuração DNS:
A     @              72.62.12.78
A     www            72.62.12.78
A     api            72.62.12.78
```

**Provedores de domínio recomendados**:
- Registro.br (Brasil)
- Cloudflare
- Namecheap
- GoDaddy

### 2. Portas Abertas
Verifique se as portas estão abertas no firewall:

```bash
# Instalar firewall (se não tiver)
sudo apt update
sudo apt install ufw

# Abrir portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 3. Acesso SSH à VPS
Você precisa ter acesso root ou sudo à VPS.

---

## Opção 1: Nginx como Proxy Reverso (Recomendado)

Esta é a solução mais simples e robusta.

### Arquitetura

```
Internet (HTTPS)
       │
       ▼
   Nginx (porta 443) ──────────┐
       │                        │
       ├─> Frontend (porta 80)  │
       │                        ├─> Docker Compose
       └─> Backend (porta 8080) │
                                │
```

### Passo 1: Instalar Nginx

```bash
# Conectar na VPS via SSH
ssh root@72.62.12.78

# Atualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar Nginx
sudo apt install nginx -y

# Verificar status
sudo systemctl status nginx
```

### Passo 2: Instalar Certbot (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Verificar instalação
certbot --version
```

### Passo 3: Configurar Nginx (HTTP apenas - temporário)

Crie o arquivo de configuração:

```bash
sudo nano /etc/nginx/sites-available/cobranca
```

Cole o seguinte conteúdo (substitua `seu-dominio.com`):

```nginx
# /etc/nginx/sites-available/cobranca

server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        rewrite ^/api(.*)$ $1 break;
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Para endpoints diretos da API (sem /api prefix)
    location ~ ^/(auth|clientes|contratos|pagamentos) {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Passo 4: Ativar a Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/cobranca /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se OK, recarregar Nginx
sudo systemctl reload nginx
```

### Passo 5: Obter Certificado SSL

```bash
# Executar Certbot
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Durante o processo, responda:
# - Email: seu@email.com
# - Aceitar termos: Y
# - Compartilhar email: N ou Y
# - Redirecionar HTTP para HTTPS: 2 (Sim, recomendado)
```

O Certbot vai:
1. Validar que você é dono do domínio
2. Obter certificado SSL gratuito
3. Configurar automaticamente o Nginx para HTTPS
4. Configurar renovação automática

### Passo 6: Atualizar docker-compose.yml

Como agora o Nginx está na porta 80/443, ajuste as portas do Docker:

```yaml
services:
  # ... outros serviços ...

  backend:
    # ... configuração existente ...
    ports:
      - "127.0.0.1:8080:8080"  # Apenas localhost

  frontend:
    # ... configuração existente ...
    ports:
      - "127.0.0.1:80:80"  # Apenas localhost
```

Isso garante que apenas o Nginx pode acessar os containers.

### Passo 7: Atualizar Variáveis de Ambiente

Atualize o arquivo `.env`:

```bash
# Frontend agora usa HTTPS
VITE_API_URL=https://seu-dominio.com

# Backend aceita requests do domínio
APP_FRONTEND_URL=https://seu-dominio.com
```

### Passo 8: Rebuild e Restart

```bash
cd /home/gustavorosa/cp-sys

# Rebuild com novas variáveis
docker compose down
docker compose up -d --build

# Restart Nginx
sudo systemctl restart nginx
```

### Passo 9: Testar HTTPS

Abra no navegador:
- `https://seu-dominio.com` ✅ Frontend
- `https://seu-dominio.com/auth/login` ✅ API de login

Verifique:
- ✅ Cadeado verde na barra de endereço
- ✅ Certificado válido
- ✅ Sem avisos de segurança

---

## Opção 2: Traefik com Docker

Alternativa mais automática, ideal para múltiplos containers.

### docker-compose.yml com Traefik

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/traefik.yml:ro
      - ./traefik/acme.json:/acme.json
      - ./traefik/config.yml:/config.yml:ro
    networks:
      - cobranca-network

  postgres:
    # ... configuração existente ...

  backend:
    # ... configuração existente ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`seu-dominio.com`) && (PathPrefix(`/api`) || PathPrefix(`/auth`) || PathPrefix(`/clientes`) || PathPrefix(`/contratos`) || PathPrefix(`/pagamentos`))"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=8080"
    networks:
      - cobranca-network

  frontend:
    # ... configuração existente ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`seu-dominio.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
    networks:
      - cobranca-network

networks:
  cobranca-network:
    driver: bridge

volumes:
  postgres_data:
```

### traefik/traefik.yml

```yaml
api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https

  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false

certificatesResolvers:
  letsencrypt:
    acme:
      email: seu@email.com
      storage: acme.json
      httpChallenge:
        entryPoint: web
```

### Criar arquivo acme.json

```bash
mkdir -p traefik
touch traefik/acme.json
chmod 600 traefik/acme.json
```

---

## Renovação Automática

### Com Certbot (Nginx)

O Certbot já configura renovação automática via cron:

```bash
# Verificar timer de renovação
sudo systemctl status certbot.timer

# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Forçar renovação (se necessário)
sudo certbot renew --force-renewal
```

Os certificados são renovados automaticamente 30 dias antes de expirar.

### Com Traefik

O Traefik renova automaticamente! Nenhuma configuração adicional necessária.

---

## Configuração Adicional de Segurança

### 1. Headers de Segurança (Nginx)

Adicione no bloco `server`:

```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 2. Rate Limiting (proteção contra ataques)

```nginx
# Antes do bloco server
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Dentro do location /auth
location ~ ^/auth/login {
    limit_req zone=login_limit burst=2 nodelay;
    proxy_pass http://localhost:8080;
    # ... resto da config
}
```

### 3. Atualizar CORS no Backend

```java
// SecurityConfig.java ou CorsConfig.java
.allowedOrigins("https://seu-dominio.com")
```

---

## Verificação e Testes

### 1. Testar SSL

```bash
# Verificar certificado
openssl s_client -connect seu-dominio.com:443 -servername seu-dominio.com

# Verificar rating SSL
# Acesse: https://www.ssllabs.com/ssltest/
```

### 2. Testar Redirecionamento HTTP → HTTPS

```bash
curl -I http://seu-dominio.com
# Deve retornar: 301 Moved Permanently
# Location: https://seu-dominio.com
```

### 3. Testar API

```bash
# Login
curl -X POST https://seu-dominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cobranca.com","senha":"admin123"}'
```

---

## Troubleshooting

### Problema: "NET::ERR_CERT_AUTHORITY_INVALID"

**Causa**: Certificado não confiável ou autofirmado

**Solução**:
1. Verifique se o Certbot executou com sucesso
2. Verifique se o domínio está corretamente configurado no DNS
3. Aguarde propagação do DNS (pode levar até 48h)

### Problema: "502 Bad Gateway"

**Causa**: Nginx não consegue conectar aos containers

**Solução**:
```bash
# Verificar se containers estão rodando
docker compose ps

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar se portas estão abertas
sudo netstat -tulpn | grep -E '80|443|8080'
```

### Problema: CORS ainda bloqueando

**Causa**: Backend não reconhece domínio HTTPS

**Solução**:
```bash
# Atualizar .env
APP_FRONTEND_URL=https://seu-dominio.com

# Rebuild
docker compose up -d --build backend
```

### Problema: Certificado não renova

**Causa**: Certbot não consegue validar domínio

**Solução**:
```bash
# Verificar logs
sudo journalctl -u certbot.timer

# Testar renovação manualmente
sudo certbot renew --dry-run

# Verificar se porta 80 está acessível
curl -I http://seu-dominio.com/.well-known/acme-challenge/test
```

---

## Checklist Final

Antes de colocar em produção:

- [ ] Domínio configurado e propagado
- [ ] Certificado SSL válido e instalado
- [ ] HTTP redireciona para HTTPS
- [ ] Firewall configurado (80, 443, 22)
- [ ] Renovação automática de certificado configurada
- [ ] Headers de segurança adicionados
- [ ] CORS atualizado para HTTPS
- [ ] Variáveis de ambiente atualizadas
- [ ] Senha admin alterada
- [ ] Backup do banco de dados configurado
- [ ] Logs sendo monitorados

---

## Configuração Rápida (Resume)

```bash
# 1. Instalar Nginx e Certbot
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx -y

# 2. Configurar Nginx
sudo nano /etc/nginx/sites-available/cobranca
# (cole a configuração acima)

sudo ln -s /etc/nginx/sites-available/cobranca /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# 4. Atualizar .env
cd /home/gustavorosa/cp-sys
nano .env
# VITE_API_URL=https://seu-dominio.com
# APP_FRONTEND_URL=https://seu-dominio.com

# 5. Rebuild containers
docker compose down
docker compose up -d --build

# 6. Verificar
curl -I https://seu-dominio.com
```

---

## Custos

- **Domínio**: R$ 40/ano (registro.br) até R$ 100+/ano
- **Certificado SSL**: **GRATUITO** (Let's Encrypt)
- **VPS**: Valor já pago
- **Total adicional**: Apenas o domínio (~R$ 40/ano)

---

## Recursos Adicionais

- [Let's Encrypt - Documentação](https://letsencrypt.org/docs/)
- [Nginx - Documentação Oficial](https://nginx.org/en/docs/)
- [SSL Labs - Teste SSL](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

**Documentação criada em**: Dezembro 2025  
**Versão**: 1.0

