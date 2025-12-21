# 💼 Sistema de Cobrança - Monorepo

Sistema completo de gerenciamento de cobranças com autenticação JWT, frontend React e backend Spring Boot.

## 🚀 Quick Start

```bash
# 1. Clone o repositório
cd /home/gustavorosa/cp-sys

# 2. Configure as variáveis de ambiente
cp env.example .env
nano .env  # Ajuste VITE_API_URL e APP_FRONTEND_URL

# 3. Suba os containers
docker compose up -d --build

# 4. Acesse o sistema
# Frontend: http://localhost ou http://seu-ip
# Backend: http://localhost:8080
```

**Login padrão**:
- Email: `admin@cobranca.com`
- Senha: `admin123`

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| **[README-DOCKER.md](README-DOCKER.md)** | Guia completo Docker Compose |
| **[AUTENTICACAO-JWT.md](AUTENTICACAO-JWT.md)** | Sistema de autenticação JWT detalhado |
| **[CONFIGURACAO-HTTPS.md](CONFIGURACAO-HTTPS.md)** | Guia completo para configurar HTTPS |
| **[HTTPS-QUICKSTART.md](HTTPS-QUICKSTART.md)** | Configuração rápida HTTPS (5 min) |

---

## 🏗️ Estrutura do Projeto

```
cp-sys/
├── backend/                    # API Spring Boot
│   ├── src/
│   │   └── main/java/dev/gustavorosa/cobranca_cp/
│   │       ├── controller/     # Controllers REST
│   │       ├── service/        # Lógica de negócio
│   │       ├── model/          # Entidades JPA
│   │       ├── repository/     # Repositories
│   │       ├── dto/            # Data Transfer Objects
│   │       ├── security/       # JWT & Security
│   │       └── config/         # Configurações
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                   # Interface React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── contexts/           # Contexts (Auth, App)
│   │   ├── pages/              # Páginas
│   │   ├── services/           # API client (Axios)
│   │   └── types/              # TypeScript types
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml          # Orquestração dos serviços
├── .env                        # Variáveis de ambiente (criar)
├── env.example                 # Exemplo de .env
└── setup-https.sh              # Script automático HTTPS
```

---

## 🔧 Tecnologias

### Backend
- ☕ **Java 21**
- 🍃 **Spring Boot 3.4.5**
- 🔐 **Spring Security + JWT**
- 🗄️ **PostgreSQL 15**
- 📦 **Maven**
- 🐳 **Docker**

### Frontend
- ⚛️ **React 19**
- 🎨 **Chakra UI**
- 🔄 **Axios**
- 🧭 **React Router**
- 📱 **Vite**
- 🐳 **Nginx + Docker**

---

## ✨ Funcionalidades

### Gestão de Clientes
- ✅ Cadastro de clientes
- ✅ Visualização de detalhes
- ✅ Exclusão de clientes
- ✅ Pesquisa e filtros

### Gestão de Contratos
- ✅ Criação de contratos
- ✅ Geração automática de parcelas
- ✅ Visualização por cliente

### Gestão de Pagamentos
- ✅ Atualização automática de status
- ✅ Marcação como pago
- ✅ Cálculo de valores em atraso
- ✅ Detecção automática de inadimplência

### Autenticação e Segurança
- 🔐 **Login/Registro** de usuários
- 🎫 **JWT Token** (1 hora de validade)
- 🔄 **Refresh Token** (7 dias)
- 👥 **Roles**: ADMIN e USER
- 🛡️ **Rotas protegidas** frontend e backend
- 🔁 **Renovação automática** de tokens
- 🔒 **BCrypt** para senhas

### Relatórios
- 📊 Geração de relatórios em PDF
- 📈 Estatísticas de inadimplência
- 💰 Total a receber por cliente

---

## 🐳 Docker Compose

### Serviços

```yaml
services:
  postgres:   # Banco de dados
  backend:    # API Spring Boot (porta 8080)
  frontend:   # React + Nginx (porta 80)
```

### Comandos Úteis

```bash
# Iniciar todos os serviços
docker compose up -d

# Parar todos os serviços
docker compose down

# Ver logs
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend

# Rebuild após mudanças
docker compose up -d --build

# Rebuild um serviço específico
docker compose up -d --build backend

# Ver status dos containers
docker compose ps

# Acessar shell de um container
docker compose exec backend bash
docker compose exec postgres psql -U gustavo -d cobranca
```

---

## 🌐 Deployment na VPS

### Opção 1: Deploy Automatizado com GitHub Actions (Recomendado)

Este projeto está configurado para deploy automático na VPS via GitHub Actions.

#### 🔧 Setup Inicial na VPS

**1. Instalar pré-requisitos**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Adicionar usuário ao grupo docker (opcional)
sudo usermod -aG docker $USER
```

**2. Clonar o projeto**
```bash
mkdir -p /home/$USER/projects
cd /home/$USER/projects
git clone https://github.com/SEU-USUARIO/cp-sys.git
cd cp-sys
```

**3. Configurar SSH Key para GitHub Actions**
```bash
# Gerar nova SSH key (se não tiver)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Adicionar public key ao authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copiar private key para configurar no GitHub
cat ~/.ssh/github_actions
# Copie o conteúdo completo (incluindo BEGIN e END)
```

**4. Criar arquivo .env base na VPS**
```bash
cd /home/$USER/projects/cp-sys
cp .env.example .env
nano .env
```

Configure as variáveis não-sensíveis:
```bash
POSTGRES_DB=cobranca
POSTGRES_USER=gustavo
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# As variáveis sensíveis serão injetadas pelo GitHub Actions:
# POSTGRES_PASSWORD, JWT_SECRET, APP_FRONTEND_URL, VITE_API_URL
```

#### ⚙️ Configurar GitHub Secrets

No seu repositório GitHub, vá em `Settings > Secrets and variables > Actions` e adicione:

**Secrets de Infraestrutura:**
- `VPS_HOST` - IP ou hostname da VPS (ex: `192.168.1.100`)
- `VPS_USER` - Usuário SSH (ex: `gustavorosa`)
- `VPS_PORT` - Porta SSH (ex: `22`)
- `VPS_SSH_KEY` - Conteúdo completo da private key gerada acima

**Secrets da Aplicação:**
- `POSTGRES_PASSWORD` - Senha segura do banco
- `JWT_SECRET` - String aleatória de pelo menos 32 caracteres
- `APP_FRONTEND_URL` - URL do frontend (ex: `https://seudominio.com`)
- `VITE_API_URL` - URL da API (ex: `https://api.seudominio.com`)

**Secrets Opcionais:**
- `DISCORD_WEBHOOK` - Webhook do Discord para notificações
- `SLACK_WEBHOOK` - Webhook do Slack para notificações

#### 🚀 Como Funciona

1. **Push para main**: Ao fazer push na branch `main`, o GitHub Actions é acionado automaticamente
2. **SSH na VPS**: Conecta na VPS usando a chave SSH
3. **Atualiza código**: Faz `git pull` do código mais recente
4. **Atualiza .env**: Injeta os secrets do GitHub no arquivo `.env`
5. **Deploy**: Executa `docker-compose down` e `docker-compose up -d --build`
6. **Health checks**: Verifica se containers subiram corretamente
7. **Notifica**: Envia notificação de sucesso/falha (se configurado)

#### 📝 Deploy Manual (Quando Necessário)

```bash
# Na VPS
cd /home/$USER/projects/cp-sys

# Usar o script de deploy
./deploy.sh

# Ou comandos Docker Compose tradicionais
docker compose down
docker compose up -d --build
```

#### 🔍 Monitorar Deployment

```bash
# Ver logs do deploy no GitHub Actions
# Acesse: https://github.com/SEU-USUARIO/cp-sys/actions

# Ver logs na VPS
cd /home/$USER/projects/cp-sys
docker compose logs -f

# Ver status dos containers
docker compose ps
```

---

### Opção 2: Deploy Manual (HTTP Básico)

```bash
# 1. Clonar projeto na VPS
git clone seu-repositorio.git cp-sys
cd cp-sys

# 2. Configurar .env
cp .env.example .env
nano .env
# Ajustar VITE_API_URL e APP_FRONTEND_URL com IP da VPS

# 3. Subir containers
docker compose up -d --build

# 4. Verificar
curl http://seu-ip:8080/auth/login
```

---

### 🌐 Configurar Nginx Reverse Proxy (Recomendado)

**1. Instalar Nginx**
```bash
sudo apt update
sudo apt install nginx -y
```

**2. Configurar site**
```bash
sudo cp nginx-vps.conf /etc/nginx/sites-available/cp-sys
sudo nano /etc/nginx/sites-available/cp-sys
# Ajustar server_name com seu domínio

sudo ln -s /etc/nginx/sites-available/cp-sys /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remover configuração padrão
```

**3. Testar e ativar**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**4. Configurar Firewall**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

### 🔒 Configurar HTTPS com Let's Encrypt

**Pré-requisito**: Ter um domínio apontando para o IP da VPS

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Renovação automática (já configurado pelo Certbot)
sudo certbot renew --dry-run
```

Depois de obter o certificado:
1. Edite o arquivo `/etc/nginx/sites-available/cp-sys`
2. Descomente a seção HTTPS
3. Ajuste os caminhos dos certificados
4. Recarregue o Nginx: `sudo systemctl reload nginx`

**OU use o setup automático:**
```bash
sudo ./setup-https.sh
# Veja: CONFIGURACAO-HTTPS.md
```

---

## 🔑 Autenticação

### Credenciais Padrão

**Admin**:
- Email: `admin@cobranca.com`
- Senha: `admin123`

⚠️ **ALTERE EM PRODUÇÃO!**

### Criar Novo Usuário

Via interface:
1. Acesse a aplicação
2. Clique em "Criar conta"
3. Preencha nome, email e senha

Via API:
```bash
curl -X POST http://seu-ip:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "senha": "senha123"
  }'
```

---

## 📝 Variáveis de Ambiente

Arquivo `.env` na raiz do projeto:

```bash
# PostgreSQL
POSTGRES_DB=cobranca
POSTGRES_USER=gustavo
POSTGRES_PASSWORD=sua_senha_segura

# Frontend - URL da API
VITE_API_URL=http://seu-ip:8080
# Para HTTPS: https://seu-dominio.com

# Backend - URL do frontend (CORS)
APP_FRONTEND_URL=http://seu-ip
# Para HTTPS: https://seu-dominio.com

# Spring Boot
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# JWT (opcional - tem padrões seguros)
JWT_SECRET=chave-super-secreta-base64
JWT_EXPIRATION=3600000        # 1 hora
JWT_REFRESH_EXPIRATION=604800000  # 7 dias
```

---

## 🔒 Segurança

### Implementado
- ✅ JWT com expiração
- ✅ Refresh tokens
- ✅ Senhas criptografadas (BCrypt)
- ✅ CORS configurado
- ✅ Stateless (sem sessões)
- ✅ Proteção de rotas

### Recomendações para Produção
1. Alterar senha admin
2. Usar HTTPS (Let's Encrypt gratuito)
3. Configurar JWT_SECRET próprio
4. Habilitar rate limiting
5. Configurar backups automáticos
6. Monitorar logs

---

## 📊 API Endpoints

### Autenticação (Públicos)

```bash
POST /auth/login          # Login
POST /auth/register       # Criar conta
POST /auth/refresh        # Renovar token
```

### Clientes (Protegidos)

```bash
GET    /clientes          # Listar todos
GET    /clientes/{id}     # Buscar por ID
POST   /clientes          # Criar
DELETE /clientes/{id}     # Excluir
```

### Contratos (Protegidos)

```bash
GET    /contratos         # Listar todos
GET    /contratos/{id}    # Buscar por ID
POST   /contratos         # Criar
```

### Pagamentos (Protegidos)

```bash
GET    /pagamentos        # Listar todos
PUT    /pagamentos/{id}   # Atualizar
```

---

## 🧪 Testes

### Backend

```bash
# Entrar no container
docker compose exec backend bash

# Rodar testes
./mvnw test
```

### Frontend

```bash
# Entrar no diretório
cd frontend

# Rodar testes (quando implementados)
npm test
```

---

## 🛠️ Script de Deploy

O projeto inclui um script de deploy robusto com validação, backup e rollback automático.

### Uso

```bash
# Deploy completo (padrão)
./deploy.sh

# Apenas criar backup
./deploy.sh backup

# Rollback para última versão
./deploy.sh rollback

# Limpeza de recursos
./deploy.sh cleanup
```

### Funcionalidades

- ✅ Validação de pré-requisitos (Docker, Docker Compose)
- ✅ Backup automático do `.env` e banco de dados
- ✅ Git pull automático
- ✅ Merge seguro de variáveis de ambiente
- ✅ Health checks após deploy
- ✅ Rollback automático em caso de falha
- ✅ Limpeza de imagens antigas
- ✅ Logs detalhados em `deploy.log`

### Logs de Deploy

```bash
# Ver logs do último deploy
tail -f deploy.log

# Ver todos os backups disponíveis
ls -lh backups/
```

---

## 📦 Backup e Restore

### Backup do Banco

```bash
# Backup manual
docker compose exec postgres pg_dump -U gustavo cobranca > backup.sql

# Backup automático (via deploy script)
./deploy.sh backup

# Restore
docker compose exec -T postgres psql -U gustavo cobranca < backup.sql
```

### Backup de Volumes

```bash
# Parar containers
docker compose down

# Backup do volume
docker run --rm -v cp-sys_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data

# Restore
docker run --rm -v cp-sys_postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/postgres_backup.tar.gz -C /
```

### Backups Automatizados

Configure um cron job para backups diários:
```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã)
0 2 * * * cd /home/$USER/projects/cp-sys && ./deploy.sh backup
```

---

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker compose logs backend

# Rebuild
docker compose up -d --build backend
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está healthy
docker compose ps

# Ver logs do PostgreSQL
docker compose logs postgres
```

### Erro de CORS

```bash
# Verificar variáveis de ambiente
docker compose exec backend env | grep FRONTEND

# Rebuild com novo APP_FRONTEND_URL
docker compose up -d --build backend
```

### Frontend mostra página branca

```bash
# Ver logs
docker compose logs frontend

# Verificar se build funcionou
docker compose exec frontend ls -la /usr/share/nginx/html

# Rebuild
docker compose up -d --build frontend
```

---

## ⚡ CI/CD com GitHub Actions

### Workflow Configurado

O projeto possui um workflow GitHub Actions (`.github/workflows/deploy.yml`) que:

1. É acionado automaticamente ao fazer push na branch `main`
2. Pode ser executado manualmente via `workflow_dispatch`
3. Conecta na VPS via SSH
4. Atualiza o código
5. Injeta secrets do GitHub
6. Faz build e deploy dos containers
7. Valida health checks
8. Envia notificações de sucesso/falha

### Executar Deploy Manualmente

No GitHub:
1. Vá em `Actions`
2. Selecione `Deploy to VPS`
3. Clique em `Run workflow`
4. Selecione a branch `main`
5. Clique em `Run workflow`

### Monitorar Status

```bash
# Ver workflow runs
https://github.com/SEU-USUARIO/cp-sys/actions

# Ver logs em tempo real na VPS
ssh usuario@vps-ip
cd /home/$USER/projects/cp-sys
docker compose logs -f
```

### Rollback Rápido

Se um deploy falhar:
```bash
# Conectar na VPS
ssh usuario@vps-ip

# Executar rollback automático
cd /home/$USER/projects/cp-sys
./deploy.sh rollback
```

---

## 🎯 Próximos Passos

1. ✅ ~~Implementar autenticação JWT~~ (Concluído)
2. ✅ ~~Configurar Docker Compose~~ (Concluído)
3. ✅ ~~Configurar CI/CD com GitHub Actions~~ (Concluído)
4. ⏳ **Configurar HTTPS** → Execute `./setup-https.sh`
5. ⏳ Alterar senha admin
6. ⏳ Configurar backups automáticos (cron job)
7. ⏳ Implementar recuperação de senha
8. ⏳ Adicionar logs de auditoria

---

## 📞 Suporte

Para dúvidas sobre:
- **Docker**: [README-DOCKER.md](README-DOCKER.md)
- **Autenticação**: [AUTENTICACAO-JWT.md](AUTENTICACAO-JWT.md)
- **HTTPS**: [CONFIGURACAO-HTTPS.md](CONFIGURACAO-HTTPS.md) ou [HTTPS-QUICKSTART.md](HTTPS-QUICKSTART.md)

---

## 📄 Licença

Sistema desenvolvido para gerenciamento de cobranças.

---

**Versão**: 1.0  
**Última atualização**: Dezembro 2025

