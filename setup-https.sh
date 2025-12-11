#!/bin/bash

# Script de Configuração Automática de HTTPS
# Sistema de Cobrança - VPS

set -e

echo "================================================"
echo "  Configuração HTTPS - Sistema de Cobrança"
echo "================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root (sudo)${NC}"
    exit 1
fi

# Solicitar informações
echo -e "${YELLOW}Digite o seu domínio (ex: meusite.com):${NC}"
read -r DOMAIN

echo -e "${YELLOW}Digite seu email (para certificado SSL):${NC}"
read -r EMAIL

echo -e "${YELLOW}Quer adicionar www.${DOMAIN}? (s/n):${NC}"
read -r ADD_WWW

if [ "$ADD_WWW" = "s" ]; then
    DOMAINS="-d $DOMAIN -d www.$DOMAIN"
    SERVER_NAME="$DOMAIN www.$DOMAIN"
else
    DOMAINS="-d $DOMAIN"
    SERVER_NAME="$DOMAIN"
fi

echo ""
echo -e "${GREEN}Configurações:${NC}"
echo "Domínio: $DOMAIN"
echo "Email: $EMAIL"
echo ""
echo "Pressione Enter para continuar ou Ctrl+C para cancelar..."
read

# 1. Atualizar sistema
echo -e "${GREEN}[1/8] Atualizando sistema...${NC}"
apt update && apt upgrade -y

# 2. Instalar Nginx
echo -e "${GREEN}[2/8] Instalando Nginx...${NC}"
apt install nginx -y

# 3. Instalar Certbot
echo -e "${GREEN}[3/8] Instalando Certbot...${NC}"
apt install certbot python3-certbot-nginx -y

# 4. Configurar firewall
echo -e "${GREEN}[4/8] Configurando firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 5. Criar configuração Nginx
echo -e "${GREEN}[5/8] Criando configuração Nginx...${NC}"
cat > /etc/nginx/sites-available/cobranca <<EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location ~ ^/(auth|clientes|contratos|pagamentos) {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
EOF

# 6. Ativar configuração
echo -e "${GREEN}[6/8] Ativando configuração...${NC}"
ln -sf /etc/nginx/sites-available/cobranca /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 7. Obter certificado SSL
echo -e "${GREEN}[7/8] Obtendo certificado SSL...${NC}"
certbot --nginx $DOMAINS --email $EMAIL --agree-tos --no-eff-email --redirect

# 8. Atualizar docker-compose.yml
echo -e "${GREEN}[8/8] Atualizando configurações Docker...${NC}"
cd /home/gustavorosa/cp-sys

# Atualizar .env
if [ -f .env ]; then
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://$DOMAIN|g" .env
    sed -i "s|APP_FRONTEND_URL=.*|APP_FRONTEND_URL=https://$DOMAIN|g" .env
else
    echo "⚠️  Arquivo .env não encontrado! Atualize manualmente:"
    echo "VITE_API_URL=https://$DOMAIN"
    echo "APP_FRONTEND_URL=https://$DOMAIN"
fi

# Rebuild containers
echo -e "${YELLOW}Rebuilding containers...${NC}"
docker compose down
docker compose up -d --build

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ HTTPS Configurado com Sucesso!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Acesse seu sistema em: ${GREEN}https://$DOMAIN${NC}"
echo ""
echo "📋 Próximos passos:"
echo "1. Aguarde alguns minutos para o build dos containers"
echo "2. Verifique se está funcionando: https://$DOMAIN"
echo "3. Teste o login com: admin@cobranca.com / admin123"
echo ""
echo "🔄 Renovação automática de certificado: ATIVADA"
echo "   (Certificados renovam automaticamente 30 dias antes de expirar)"
echo ""
echo "📊 Para ver logs:"
echo "   - Nginx: sudo tail -f /var/log/nginx/cobranca_error.log"
echo "   - Docker: docker compose logs -f"
echo ""
echo -e "${YELLOW}⚠️  NÃO SE ESQUEÇA:${NC}"
echo "   - Alterar a senha do admin!"
echo "   - Configurar backups do banco de dados"
echo ""

