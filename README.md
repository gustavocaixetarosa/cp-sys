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

### 1. Configuração Básica (HTTP)

```bash
# 1. Clonar projeto na VPS
git clone seu-repositorio.git cp-sys
cd cp-sys

# 2. Configurar .env
cp env.example .env
nano .env
# Ajustar VITE_API_URL e APP_FRONTEND_URL com IP da VPS

# 3. Subir containers
docker compose up -d --build

# 4. Verificar
curl http://seu-ip:8080/auth/login
```

### 2. Configuração com HTTPS (Produção)

**Pré-requisito**: Ter um domínio configurado

```bash
# Opção Automática
sudo ./setup-https.sh

# OU Opção Manual
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

## 📦 Backup e Restore

### Backup do Banco

```bash
# Backup
docker compose exec postgres pg_dump -U gustavo cobranca > backup.sql

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

## 🎯 Próximos Passos

1. ✅ ~~Implementar autenticação JWT~~ (Concluído)
2. ✅ ~~Configurar Docker Compose~~ (Concluído)
3. ⏳ **Configurar HTTPS** → Execute `./setup-https.sh`
4. ⏳ Alterar senha admin
5. ⏳ Configurar backups automáticos
6. ⏳ Implementar recuperação de senha
7. ⏳ Adicionar logs de auditoria

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

