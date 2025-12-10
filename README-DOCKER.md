# Docker Compose - Sistema de Cobrança

Este projeto utiliza Docker Compose para orquestrar os serviços do sistema.

## Estrutura

- **PostgreSQL**: Banco de dados na porta 5432
- **Backend**: API Spring Boot na porta 8080
- **Frontend**: Aplicação React servida pelo Nginx na porta 80

## Como usar

### Desenvolvimento local

1. Certifique-se de ter o Docker e Docker Compose instalados
2. Na raiz do projeto, execute:

```bash
docker-compose up -d
```

3. Acesse:
   - Frontend: http://localhost
   - Backend API: http://localhost:8080
   - PostgreSQL: localhost:5432

### Parar os serviços

```bash
docker-compose down
```

### Parar e remover volumes (apaga dados do banco)

```bash
docker-compose down -v
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild após mudanças

```bash
# Rebuild de todos os serviços
docker-compose up -d --build

# Rebuild de um serviço específico
docker-compose up -d --build backend
```

## Configuração para VPS

### 1. Atualizar URL da API no frontend

No arquivo `docker-compose.yml`, atualize a variável `VITE_API_URL` no build do frontend:

```yaml
frontend:
  build:
    args:
      VITE_API_URL: http://seu-dominio.com:8080
      # ou se usar proxy reverso:
      # VITE_API_URL: http://api.seu-dominio.com
```

### 2. Configurar proxy reverso (opcional, recomendado)

Para produção, recomenda-se usar um Nginx como proxy reverso na VPS:

```nginx
# /etc/nginx/sites-available/cobranca
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Variáveis de ambiente

O projeto suporta variáveis de ambiente através de um arquivo `.env`. Copie o arquivo de exemplo:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```bash
# .env
POSTGRES_DB=cobranca
POSTGRES_USER=gustavo
POSTGRES_PASSWORD=sua_senha_segura

# URL da API para o frontend (importante para VPS!)
# Use o IP ou domínio da sua VPS
VITE_API_URL=http://seu-ip-ou-dominio:8080
```

O `docker-compose.yml` já está configurado para usar essas variáveis. Se não criar o arquivo `.env`, os valores padrão serão usados.

## Troubleshooting

### Backend não conecta ao banco

Verifique se o PostgreSQL está saudável:
```bash
docker-compose ps
```

O backend aguarda o PostgreSQL estar pronto antes de iniciar.

### Frontend não carrega

Verifique os logs:
```bash
docker-compose logs frontend
```

Certifique-se de que a variável `VITE_API_URL` está configurada corretamente.

### Porta já em uso

Se as portas 80, 8080 ou 5432 estiverem em uso, altere no `docker-compose.yml`:

```yaml
ports:
  - "8081:8080"  # Backend na porta 8081
  - "81:80"      # Frontend na porta 81
```

