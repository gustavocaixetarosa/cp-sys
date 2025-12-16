# 🎯 Próximos Passos: Configurar Domínio no VPS

## Checklist Inicial

Antes de começar, você precisa ter:
- ✅ Domínio comprado
- ✅ Acesso SSH à sua VPS
- ✅ IP da VPS (ex: `72.62.12.78`)

---

## Passo 1: Configurar DNS do Domínio

**IMPORTANTE**: Este é o passo mais crítico! O domínio precisa apontar para o IP da VPS.

### Onde configurar:
- **Registro.br**: Painel → Gerenciar DNS
- **Cloudflare**: DNS → Records
- **Namecheap/GoDaddy**: Advanced DNS

### Configuração DNS necessária:

```
Tipo    Nome    Valor           TTL
A       @       SEU_IP_VPS      3600
A       www     SEU_IP_VPS      3600
```

**Exemplo**:
```
Tipo    Nome    Valor           TTL
A       @       72.62.12.78     3600
A       www     72.62.12.78     3600
```

### Verificar propagação DNS:

```bash
# No seu computador local, execute:
nslookup seu-dominio.com
# ou
dig seu-dominio.com

# Deve retornar o IP da sua VPS
```

⏰ **Aguarde**: A propagação DNS pode levar de 5 minutos a 48 horas. Geralmente leva 1-2 horas.

---

## Passo 2: Conectar na VPS

```bash
ssh root@SEU_IP_VPS
# ou
ssh usuario@SEU_IP_VPS
```

---

## Passo 3: Executar Script Automático (Recomendado)

O projeto já tem um script que faz tudo automaticamente:

```bash
# 1. Ir para o diretório do projeto
cd /home/gustavorosa/cp-sys

# 2. Dar permissão de execução (se necessário)
chmod +x setup-https.sh

# 3. Executar o script
sudo ./setup-https.sh
```

O script vai perguntar:
- **Domínio**: Digite seu domínio (ex: `meusite.com.br`)
- **Email**: Seu email para notificações do certificado SSL
- **www**: Se quer incluir `www.meusite.com.br`

O script vai fazer automaticamente:
1. ✅ Instalar Nginx
2. ✅ Instalar Certbot (Let's Encrypt)
3. ✅ Configurar firewall (portas 22, 80, 443)
4. ✅ Criar configuração Nginx
5. ✅ Obter certificado SSL gratuito
6. ✅ Configurar renovação automática
7. ✅ Atualizar variáveis de ambiente
8. ✅ Rebuildar containers Docker

**Tempo estimado**: 5-10 minutos

---

## Passo 4: Configuração Manual (Alternativa)

Se preferir fazer manualmente ou o script não funcionar:

### 4.1. Instalar Nginx e Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 4.2. Configurar Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 4.3. Criar Configuração Nginx

```bash
sudo nano /etc/nginx/sites-available/cobranca
```

Cole este conteúdo (substitua `seu-dominio.com` pelo seu domínio):

```nginx
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

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    access_log /var/log/nginx/cobranca_access.log;
    error_log /var/log/nginx/cobranca_error.log;
}
```

Salve e saia (Ctrl+X, Y, Enter).

### 4.4. Ativar Configuração

```bash
sudo ln -s /etc/nginx/sites-available/cobranca /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 4.5. Obter Certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Durante o processo:
- **Email**: Digite seu email
- **Aceitar termos**: Digite `Y`
- **Compartilhar email**: `N` ou `Y` (sua escolha)
- **Redirecionar HTTP → HTTPS**: Digite `2` (Sim, recomendado)

O Certbot vai:
- Validar que você é dono do domínio
- Obter certificado SSL gratuito
- Configurar Nginx automaticamente para HTTPS
- Configurar renovação automática

### 4.6. Atualizar Variáveis de Ambiente

```bash
cd /home/gustavorosa/cp-sys
nano .env
```

Altere estas linhas:

```bash
VITE_API_URL=https://seu-dominio.com
APP_FRONTEND_URL=https://seu-dominio.com
```

Salve e saia.

### 4.7. Rebuildar Containers

```bash
docker compose down
docker compose up -d --build
```

---

## Passo 5: Verificar se Funcionou

### 5.1. Testar HTTP (deve redirecionar para HTTPS)

```bash
curl -I http://seu-dominio.com
# Deve retornar: 301 Moved Permanently
# Location: https://seu-dominio.com
```

### 5.2. Testar HTTPS

```bash
curl -I https://seu-dominio.com
# Deve retornar: 200 OK
```

### 5.3. Abrir no Navegador

Acesse: `https://seu-dominio.com`

Você deve ver:
- ✅ Cadeado verde na barra de endereço
- ✅ Sem avisos de segurança
- ✅ Frontend carregando normalmente

### 5.4. Testar Login

```bash
curl -X POST https://seu-dominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cobranca.com","senha":"admin123"}'
```

Deve retornar um token JWT.

---

## Passo 6: Atualizar CORS no Backend (Se Necessário)

Se ainda houver problemas de CORS, verifique o arquivo de configuração:

```bash
# Verificar configuração CORS
cat backend/src/main/java/dev/gustavorosa/cobranca_cp/config/CorsConfig.java
```

Certifique-se de que está permitindo o domínio HTTPS.

---

## Troubleshooting

### ❌ Erro: "NET::ERR_CERT_AUTHORITY_INVALID"

**Causa**: DNS ainda não propagou ou domínio não configurado corretamente.

**Solução**:
1. Verifique se o DNS está correto:
   ```bash
   nslookup seu-dominio.com
   ```
2. Aguarde mais tempo (pode levar até 48h)
3. Verifique se o Certbot executou com sucesso:
   ```bash
   sudo certbot certificates
   ```

### ❌ Erro: "502 Bad Gateway"

**Causa**: Nginx não consegue conectar aos containers Docker.

**Solução**:
```bash
# Verificar se containers estão rodando
docker compose ps

# Verificar logs
docker compose logs backend
docker compose logs frontend

# Verificar se portas estão corretas
sudo netstat -tulpn | grep -E '80|443|8080'
```

### ❌ Erro: CORS bloqueando requisições

**Causa**: Backend não reconhece o novo domínio HTTPS.

**Solução**:
1. Verifique o arquivo `.env`:
   ```bash
   cat .env | grep APP_FRONTEND_URL
   ```
2. Rebuild o backend:
   ```bash
   docker compose up -d --build backend
   ```

### ❌ Certbot falha na validação

**Causa**: Porta 80 não está acessível ou DNS não propagou.

**Solução**:
1. Verifique se a porta 80 está aberta:
   ```bash
   sudo ufw status
   curl -I http://seu-dominio.com
   ```
2. Aguarde propagação DNS
3. Tente novamente:
   ```bash
   sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
   ```

---

## Verificação Final

Antes de considerar concluído, verifique:

- [ ] DNS propagado (nslookup retorna IP correto)
- [ ] HTTP redireciona para HTTPS
- [ ] HTTPS funciona com cadeado verde
- [ ] Frontend carrega corretamente
- [ ] Login funciona
- [ ] API responde corretamente
- [ ] Renovação automática configurada

Verificar renovação automática:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## Próximas Ações Recomendadas

1. **Alterar senha do admin** (se ainda não alterou)
2. **Configurar backup do banco de dados**
3. **Monitorar logs**:
   ```bash
   # Logs Nginx
   sudo tail -f /var/log/nginx/cobranca_error.log
   
   # Logs Docker
   docker compose logs -f
   ```
4. **Testar SSL**: https://www.ssllabs.com/ssltest/

---

## Documentação Adicional

- **Guia Completo**: `CONFIGURACAO-HTTPS.md`
- **Quick Start**: `HTTPS-QUICKSTART.md`
- **Script Automático**: `setup-https.sh`

---

## Resumo Rápido

```bash
# 1. Configurar DNS (no painel do domínio)
A    @    SEU_IP_VPS
A    www  SEU_IP_VPS

# 2. Aguardar propagação DNS (1-2 horas)

# 3. Na VPS, executar:
cd /home/gustavorosa/cp-sys
sudo ./setup-https.sh

# 4. Pronto! Acesse: https://seu-dominio.com
```

---

**Dúvidas?** Consulte a documentação completa em `CONFIGURACAO-HTTPS.md`

