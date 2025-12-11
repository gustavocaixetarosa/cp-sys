# 🚀 HTTPS Quick Start - 5 Minutos

## Opção 1: Script Automático (Recomendado)

```bash
# Na sua VPS, execute:
cd /home/gustavorosa/cp-sys
sudo ./setup-https.sh
```

O script vai:
1. ✅ Instalar Nginx e Certbot
2. ✅ Configurar firewall
3. ✅ Obter certificado SSL gratuito
4. ✅ Configurar proxy reverso
5. ✅ Atualizar variáveis de ambiente
6. ✅ Rebuildar containers

**Tempo estimado**: 5-10 minutos

---

## Opção 2: Manual

### 1. Instalar

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configurar Nginx

```bash
sudo cp nginx-exemplo.conf /etc/nginx/sites-available/cobranca
sudo nano /etc/nginx/sites-available/cobranca
# Altere 'seu-dominio.com' para seu domínio real

sudo ln -s /etc/nginx/sites-available/cobranca /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Obter SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 4. Atualizar .env

```bash
nano .env
```

Altere:
```bash
VITE_API_URL=https://seu-dominio.com
APP_FRONTEND_URL=https://seu-dominio.com
```

### 5. Rebuild

```bash
docker compose down
docker compose up -d --build
```

---

## Verificação

```bash
# Deve mostrar 301 redirect
curl -I http://seu-dominio.com

# Deve funcionar com HTTPS
curl -I https://seu-dominio.com

# Testar login
curl -X POST https://seu-dominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cobranca.com","senha":"admin123"}'
```

---

## Pré-requisitos

1. **Domínio apontando para VPS**:
   ```
   A    @     72.62.12.78
   A    www   72.62.12.78
   ```

2. **Portas abertas**:
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)

---

## Troubleshooting

### Erro: "NET::ERR_CERT_AUTHORITY_INVALID"

Aguarde propagação do DNS (até 48h) ou verifique:
```bash
nslookup seu-dominio.com
```

### Erro: "502 Bad Gateway"

Verifique containers:
```bash
docker compose ps
docker compose logs backend
```

### CORS ainda bloqueando

Rebuild backend com novo domínio:
```bash
docker compose up -d --build backend
```

---

## Documentação Completa

📖 Leia: `CONFIGURACAO-HTTPS.md`

- Explicação detalhada
- Opção com Traefik
- Configurações avançadas de segurança
- Rate limiting
- Headers de segurança

---

## Custos

- SSL (Let's Encrypt): **GRATUITO** ✅
- Domínio: ~R$ 40/ano
- Renovação automática: **GRATUITA** ✅

---

## Suporte

Em caso de dúvidas, consulte:
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [SSL Test](https://www.ssllabs.com/ssltest/)

