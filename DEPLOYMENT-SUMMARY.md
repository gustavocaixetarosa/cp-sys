# 📦 Resumo da Configuração de Deploy

## ✅ Arquivos Criados/Modificados

### 1. GitHub Actions Workflow
- **Arquivo**: `.github/workflows/deploy.yml`
- **Função**: Deploy automático via SSH na VPS
- **Trigger**: Push na branch `main` ou manual
- **Recursos**:
  - Conexão SSH segura
  - Pull automático do código
  - Injeção de secrets do GitHub
  - Build e deploy dos containers
  - Health checks automáticos
  - Rollback em caso de falha
  - Notificações (Discord/Slack)

### 2. Script de Deploy
- **Arquivo**: `deploy.sh`
- **Função**: Deploy robusto com validação e backup
- **Recursos**:
  - Validação de pré-requisitos
  - Backup automático (.env e banco)
  - Merge seguro de variáveis de ambiente
  - Health checks após deploy
  - Rollback automático se falhar
  - Limpeza de imagens antigas
  - Logs detalhados

### 3. Template de Variáveis
- **Arquivo**: `.env.example`
- **Função**: Template para configuração
- **Conteúdo**:
  - Configurações do banco de dados
  - URLs do frontend e backend
  - Configurações Spring Boot
  - JWT secrets
  - Variáveis opcionais

### 4. Docker Compose Atualizado
- **Arquivo**: `docker-compose.yml`
- **Melhorias**:
  - Health checks em todos os serviços
  - Restart policies configuradas
  - Logging configurado (max 10MB, 3 arquivos)
  - Dependências com health conditions
  - Start period otimizado

### 5. Configuração Nginx
- **Arquivo**: `nginx-vps.conf`
- **Função**: Reverse proxy para produção
- **Recursos**:
  - Proxy para frontend (porta 8081)
  - Proxy para backend API (porta 8080)
  - Headers de segurança
  - Configuração HTTP e HTTPS
  - Restrição de acesso ao actuator
  - Health check endpoint
  - Timeouts otimizados

### 6. Documentação
- **Arquivo**: `README.md` (atualizado)
- **Adições**:
  - Seção completa de deploy com GitHub Actions
  - Configuração de secrets no GitHub
  - Setup inicial da VPS
  - Configuração do Nginx
  - Troubleshooting
  - CI/CD workflow

### 7. Guia de Setup
- **Arquivo**: `DEPLOY-SETUP.md`
- **Função**: Guia passo-a-passo completo
- **Conteúdo**:
  - Checklist de setup
  - Instalação de dependências
  - Configuração SSH
  - GitHub Secrets
  - Nginx e HTTPS
  - Troubleshooting detalhado

### 8. GitIgnore
- **Arquivo**: `.gitignore` (raiz)
- **Função**: Proteger arquivos sensíveis
- **Ignora**:
  - .env e variantes
  - Logs
  - Backups
  - Arquivos IDE
  - Arquivos do sistema

## 🔐 GitHub Secrets Necessários

Configure no GitHub → Settings → Secrets and variables → Actions:

### Infraestrutura
- `VPS_HOST` - IP ou hostname da VPS
- `VPS_USER` - Usuário SSH
- `VPS_PORT` - Porta SSH (padrão: 22)
- `VPS_SSH_KEY` - Chave SSH privada

### Aplicação
- `POSTGRES_PASSWORD` - Senha do banco
- `JWT_SECRET` - Secret para JWT
- `APP_FRONTEND_URL` - URL do frontend
- `VITE_API_URL` - URL da API

### Opcionais
- `DISCORD_WEBHOOK` - Notificações Discord
- `SLACK_WEBHOOK` - Notificações Slack

## 🚀 Como Usar

### Setup Inicial (Uma Vez)

1. **Na VPS**:
   ```bash
   # Instalar Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt-get install docker-compose-plugin
   
   # Clonar projeto
   mkdir -p /home/$USER/projects
   cd /home/$USER/projects
   git clone https://github.com/SEU-USUARIO/cp-sys.git
   cd cp-sys
   
   # Gerar SSH key
   ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
   cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
   
   # Configurar .env base
   cp .env.example .env
   nano .env  # Editar variáveis não-sensíveis
   ```

2. **No GitHub**:
   - Copiar private key: `cat ~/.ssh/github_actions`
   - Configurar todos os Secrets mencionados acima

3. **Testar**:
   ```bash
   git add .
   git commit -m "Setup deploy"
   git push origin main
   ```

### Deploy Automático (Normal)

Simplesmente faça push para a branch `main`:
```bash
git add .
git commit -m "Suas alterações"
git push origin main
```

O GitHub Actions fará:
1. Conectar na VPS
2. Atualizar código
3. Atualizar .env com secrets
4. Rebuild containers
5. Validar health
6. Notificar resultado

### Deploy Manual

Na VPS:
```bash
cd /home/$USER/projects/cp-sys
./deploy.sh
```

Ou no GitHub:
1. Ir em Actions
2. Selecionar "Deploy to VPS"
3. Clicar "Run workflow"

## 📊 Fluxo de Deploy

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│   Triggered     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SSH to VPS     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Git Pull       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update .env     │
│ (merge secrets) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ docker-compose  │
│     down        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ docker-compose  │
│  up --build     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Health Checks   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────┐
│Success│ │  Failed  │
└───┬───┘ └────┬─────┘
    │          │
    │          ▼
    │    ┌──────────┐
    │    │ Rollback │
    │    └──────────┘
    │
    ▼
┌─────────────────┐
│   Notify        │
│ (Discord/Slack) │
└─────────────────┘
```

## 🔧 Comandos Úteis

### Na VPS
```bash
# Ver status dos containers
docker compose ps

# Ver logs
docker compose logs -f

# Ver logs de um serviço
docker compose logs -f backend

# Deploy manual
./deploy.sh

# Criar backup
./deploy.sh backup

# Rollback
./deploy.sh rollback

# Limpar recursos
./deploy.sh cleanup

# Ver logs de deploy
tail -f deploy.log
```

### No GitHub
```bash
# Ver workflows
https://github.com/SEU-USUARIO/cp-sys/actions

# Executar manualmente
Actions → Deploy to VPS → Run workflow
```

## 🌐 Nginx (Opcional mas Recomendado)

```bash
# Instalar
sudo apt install nginx -y

# Configurar
sudo cp nginx-vps.conf /etc/nginx/sites-available/cp-sys
sudo nano /etc/nginx/sites-available/cp-sys  # Ajustar server_name
sudo ln -s /etc/nginx/sites-available/cp-sys /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar e ativar
sudo nginx -t
sudo systemctl reload nginx

# Firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 🔒 HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática já está configurada
```

## 📚 Documentação Completa

- **DEPLOY-SETUP.md** - Guia passo-a-passo detalhado
- **README.md** - Documentação completa do projeto
- **.env.example** - Template de variáveis
- **deploy.sh** - Script de deploy

## ✨ Recursos Implementados

- ✅ Deploy automático via GitHub Actions
- ✅ Backup automático antes de deploy
- ✅ Rollback automático em falhas
- ✅ Health checks dos containers
- ✅ Injeção segura de secrets
- ✅ Logs detalhados de deploy
- ✅ Notificações de sucesso/falha
- ✅ Script de deploy manual
- ✅ Configuração Nginx para produção
- ✅ Suporte a HTTPS
- ✅ Logging configurado nos containers
- ✅ Restart policies automáticas
- ✅ Documentação completa

## 🎯 Próximos Passos Recomendados

1. ✅ Setup inicial na VPS (se ainda não fez)
2. ✅ Configurar GitHub Secrets
3. ✅ Fazer primeiro deploy
4. ⏳ Configurar Nginx (se for expor publicamente)
5. ⏳ Configurar HTTPS (se tiver domínio)
6. ⏳ Alterar senha admin padrão
7. ⏳ Configurar backups automáticos (cron job)
8. ⏳ Monitorar logs regularmente

---

**Status**: ✅ Deploy automatizado configurado e pronto para uso!

