# 🚀 Guia Rápido de Deploy com GitHub Actions

Este guia irá te ajudar a configurar o deploy automático da sua aplicação CP-SYS na VPS usando GitHub Actions.

## 📋 Checklist de Setup

- [ ] VPS com Docker instalado
- [ ] Repositório no GitHub
- [ ] Domínio apontando para VPS (opcional, mas recomendado)

## 🔧 Passo 1: Preparar a VPS

### 1.1. Instalar Docker e Docker Compose

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente para aplicar
```

### 1.2. Clonar o Repositório

```bash
mkdir -p /home/$USER/projects
cd /home/$USER/projects
git clone https://github.com/SEU-USUARIO/cp-sys.git
cd cp-sys
```

### 1.3. Configurar SSH Key para GitHub Actions

```bash
# Gerar uma nova SSH key dedicada para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions

# Adicionar a public key ao authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Ajustar permissões
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Copiar a PRIVATE key (vamos usar no GitHub Secrets)
cat ~/.ssh/github_actions
```

**⚠️ IMPORTANTE**: Copie TODO o conteúdo da private key, incluindo as linhas:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### 1.4. Criar Arquivo .env Base

```bash
cd /home/$USER/projects/cp-sys

# Copiar template
cp .env.example .env

# Editar com valores não-sensíveis
nano .env
```

Deixe o arquivo assim:
```bash
# Variáveis não-sensíveis (mantidas na VPS)
POSTGRES_DB=cobranca
POSTGRES_USER=gustavo
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# Variáveis sensíveis serão injetadas pelo GitHub Actions
# POSTGRES_PASSWORD=
# JWT_SECRET=
# APP_FRONTEND_URL=
# VITE_API_URL=
```

## 🔐 Passo 2: Configurar GitHub Secrets

Vá no seu repositório no GitHub:
1. Clique em **Settings**
2. No menu lateral, clique em **Secrets and variables** → **Actions**
3. Clique em **New repository secret**

### 2.1. Secrets de Infraestrutura

Crie os seguintes secrets:

| Nome | Valor | Exemplo |
|------|-------|---------|
| `VPS_HOST` | IP ou hostname da VPS | `192.168.1.100` ou `vps.seudominio.com` |
| `VPS_USER` | Usuário SSH | `gustavo` ou `ubuntu` |
| `VPS_PORT` | Porta SSH | `22` (padrão) |
| `VPS_SSH_KEY` | Private key SSH | Conteúdo completo da key copiada no passo 1.3 |

### 2.2. Secrets da Aplicação

| Nome | Valor | Exemplo |
|------|-------|---------|
| `POSTGRES_PASSWORD` | Senha forte do PostgreSQL | `Str0ng_P@ssw0rd_2024!` |
| `JWT_SECRET` | String aleatória de 32+ chars | `meu-super-secret-jwt-key-12345678` |
| `APP_FRONTEND_URL` | URL completa do frontend | `https://app.seudominio.com` ou `http://192.168.1.100` |
| `VITE_API_URL` | URL base do domínio (sem /api) | `https://seudominio.com` ou `http://192.168.1.100` |

### 2.3. Secrets Opcionais (Notificações)

| Nome | Valor | Como Obter |
|------|-------|------------|
| `DISCORD_WEBHOOK` | URL do webhook Discord | [Criar webhook no Discord](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) |
| `SLACK_WEBHOOK` | URL do webhook Slack | [Criar webhook no Slack](https://api.slack.com/messaging/webhooks) |

### 🔑 Como Gerar um JWT_SECRET Seguro

```bash
# Opção 1: OpenSSL
openssl rand -base64 32

# Opção 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Opção 3: Online (menos seguro)
# https://www.random.org/strings/
```

## ✅ Passo 3: Testar o Deploy

### 3.1. Fazer um Commit e Push

```bash
# No seu computador local
git add .
git commit -m "Configurar GitHub Actions deploy"
git push origin main
```

### 3.2. Acompanhar o Deploy

1. Vá no GitHub → seu repositório
2. Clique na aba **Actions**
3. Você verá o workflow "Deploy to VPS" em execução
4. Clique nele para ver os logs em tempo real

### 3.3. Verificar na VPS

```bash
# Conectar na VPS
ssh usuario@ip-da-vps

# Ver status dos containers
cd /home/$USER/projects/cp-sys
docker compose ps

# Ver logs
docker compose logs -f

# Testar backend
curl http://localhost:8080/actuator/health

# Testar frontend
curl http://localhost:8081
```

## 🌐 Passo 4: Configurar Nginx (Recomendado)

### 4.1. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### 4.2. Configurar Site

```bash
# Copiar arquivo de configuração
sudo cp nginx-vps.conf /etc/nginx/sites-available/cp-sys

# Editar e ajustar o server_name
sudo nano /etc/nginx/sites-available/cp-sys
# Trocar "yourdomain.com" pelo seu domínio ou IP

# Ativar o site
sudo ln -s /etc/nginx/sites-available/cp-sys /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 4.3. Configurar Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 4.4. Testar

```bash
curl http://seu-dominio-ou-ip
```

## 🔒 Passo 5: Configurar HTTPS (Produção)

**Pré-requisito**: Ter um domínio apontando para o IP da VPS

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Certificado será renovado automaticamente
```

Depois de obter o certificado:

1. Edite o Nginx config: `sudo nano /etc/nginx/sites-available/cp-sys`
2. Descomente a seção HTTPS
3. Ajuste os caminhos dos certificados (geralmente já estão corretos)
4. Recarregue: `sudo systemctl reload nginx`

## 🎉 Pronto!

Seu sistema agora está configurado para deploy automático!

### Como Funciona Agora

1. Você faz alterações no código localmente
2. Faz commit e push para a branch `main`
3. GitHub Actions detecta o push automaticamente
4. Conecta na VPS via SSH
5. Atualiza o código
6. Faz rebuild dos containers
7. Valida que tudo subiu corretamente
8. Envia notificação (se configurado)

### Deploy Manual (Quando Necessário)

```bash
# Na VPS
cd /home/$USER/projects/cp-sys
./deploy.sh
```

## 🐛 Troubleshooting

### Erro: Permission denied (publickey)

**Problema**: GitHub Actions não consegue conectar na VPS

**Solução**:
```bash
# Na VPS, verificar permissões
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verificar se a public key está correta
cat ~/.ssh/authorized_keys

# Testar conexão manualmente
ssh -i ~/.ssh/github_actions usuario@localhost
```

### Erro: Container não inicia

**Solução**:
```bash
# Ver logs
docker compose logs backend
docker compose logs postgres

# Verificar .env
cat .env

# Rebuild completo
docker compose down
docker compose up -d --build
```

### Erro: Health check failed

**Problema**: Backend não responde após deploy

**Solução**:
```bash
# Verificar se PostgreSQL está pronto
docker compose ps postgres

# Ver logs do backend
docker compose logs backend

# Pode levar até 60 segundos para o backend iniciar
# Aguarde e tente novamente
```

### Erro: CORS

**Problema**: Frontend não consegue conectar no backend

**Solução**:
```bash
# Verificar variável APP_FRONTEND_URL no GitHub Secrets
# Deve corresponder à URL que você acessa o frontend

# Exemplo:
# Se acessa por: https://app.meusite.com
# APP_FRONTEND_URL deve ser: https://app.meusite.com

# Rebuild após corrigir
docker compose up -d --build backend
```

## 📚 Recursos Adicionais

- **README.md**: Documentação completa do projeto
- **deploy.sh**: Script de deploy com backup e rollback
- **.env.example**: Template de variáveis de ambiente
- **nginx-vps.conf**: Configuração do Nginx

## 💡 Dicas

1. **Backups**: Configure um cron job para backups automáticos
   ```bash
   crontab -e
   # Adicione: 0 2 * * * cd /home/$USER/projects/cp-sys && ./deploy.sh backup
   ```

2. **Monitoramento**: Use `docker compose logs -f` para monitorar em tempo real

3. **Rollback**: Se algo der errado, use `./deploy.sh rollback`

4. **Segurança**: Altere a senha admin após primeiro login

5. **Updates**: Mantenha Docker e sistema operacional atualizados
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs do GitHub Actions
2. Verifique os logs na VPS: `docker compose logs`
3. Consulte o README.md para mais detalhes
4. Verifique a configuração dos GitHub Secrets

---

**Boa sorte com seu deploy! 🚀**

