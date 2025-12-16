# 🔍 Diagnóstico e Correção do Erro 403

## Problema
Requisições para `/clientes` e `/pagamentos` retornam `403 Forbidden`.

---

## Diagnóstico Passo a Passo

### 1. Verificar se o token JWT está sendo enviado

No navegador (F12 → Console), execute:

```javascript
// Verificar se o token existe
console.log('Token:', localStorage.getItem('token'));

// Verificar URL da API
console.log('API URL:', import.meta.env.VITE_API_URL);

// Verificar se o token está sendo enviado nas requisições
// Vá na aba Network, faça uma requisição e veja os Headers
// Deve ter: Authorization: Bearer <token>
```

**Se o token não existir:**
- Faça logout e login novamente
- Verifique se o login está funcionando

### 2. Verificar configuração do .env na VPS

```bash
cd ~/cp-sys
cat .env
```

**Deve estar assim:**
```bash
VITE_API_URL=https://cpacessoriaecobranca.com.br
APP_FRONTEND_URL=https://cpacessoriaecobranca.com.br
```

**⚠️ IMPORTANTE:**
- ✅ Use `https://` (não `http://`)
- ✅ **SEM porta** (Nginx faz proxy)
- ✅ Domínio completo: `cpacessoriaecobranca.com.br`

### 3. Verificar logs do backend

```bash
docker compose logs backend | tail -50
```

Procure por:
- `Configurando CORS para frontend:`
- `Request sem token JWT:`
- `Token JWT inválido para:`
- Erros de CORS

### 4. Verificar se os containers foram rebuildados

```bash
# Verificar quando os containers foram criados
docker compose ps

# Se foram criados antes de atualizar o .env, precisa rebuildar
docker compose down
docker compose up -d --build
```

### 5. Verificar CORS no backend

```bash
# Verificar variável de ambiente no container
docker compose exec backend env | grep APP_FRONTEND_URL
```

Deve mostrar: `APP_FRONTEND_URL=https://cpacessoriaecobranca.com.br`

---

## Solução Completa

### Passo 1: Atualizar .env

```bash
cd ~/cp-sys
nano .env
```

Certifique-se de que está exatamente assim:

```bash
POSTGRES_DB=cobranca
POSTGRES_USER=gustavo
POSTGRES_PASSWORD=139150

VITE_API_URL=https://cpacessoriaecobranca.com.br
APP_FRONTEND_URL=https://cpacessoriaecobranca.com.br

SPRING_JPA_HIBERNATE_DDL_AUTO=update
```

### Passo 2: Rebuildar containers

```bash
docker compose down
docker compose up -d --build
```

Aguarde o build terminar (pode levar alguns minutos).

### Passo 3: Verificar se funcionou

```bash
# Ver logs do backend
docker compose logs -f backend

# Em outro terminal, verificar containers
docker compose ps
```

### Passo 4: Limpar cache do navegador

1. Pressione `Ctrl+Shift+Delete`
2. Selecione "Cache" e "Cookies"
3. Limpe tudo
4. Feche e abra o navegador novamente

### Passo 5: Fazer login novamente

1. Acesse: `https://cpacessoriaecobranca.com.br`
2. Faça logout (se estiver logado)
3. Faça login novamente
4. Teste acessar `/clientes` e `/pagamentos`

---

## Verificações Adicionais

### Verificar se o Nginx está fazendo proxy corretamente

```bash
sudo cat /etc/nginx/sites-available/cobranca | grep -A 10 "location"
```

Deve mostrar:
```nginx
location / {
    proxy_pass http://localhost:8081;  # Frontend
    ...
}

location ~ ^/(auth|clientes|contratos|pagamentos) {
    proxy_pass http://localhost:8080;  # Backend
    ...
}
```

### Testar requisição direta ao backend

```bash
# Obter token fazendo login
curl -X POST https://cpacessoriaecobranca.com.br/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cobranca.com","senha":"admin123"}'

# Usar o token retornado para testar
TOKEN="seu-token-aqui"
curl -X GET https://cpacessoriaecobranca.com.br/clientes \
  -H "Authorization: Bearer $TOKEN"
```

Se funcionar via curl mas não no navegador, o problema é CORS ou token não sendo enviado.

---

## Problemas Comuns

### Problema 1: Token não está sendo enviado

**Sintoma:** Logs mostram "Request sem token JWT"

**Solução:**
1. Verifique se fez login
2. Verifique no console do navegador: `localStorage.getItem('token')`
3. Verifique na aba Network se o header `Authorization` está presente

### Problema 2: CORS bloqueando

**Sintoma:** Erro no console: "CORS policy" ou "Access-Control-Allow-Origin"

**Solução:**
1. Verifique se `APP_FRONTEND_URL` está correto no `.env`
2. Rebuild o backend: `docker compose up -d --build backend`
3. Verifique logs: `docker compose logs backend | grep CORS`

### Problema 3: Token inválido/expirado

**Sintoma:** Logs mostram "Token JWT inválido"

**Solução:**
1. Faça logout e login novamente
2. Verifique se o token não expirou (padrão: 1 hora)

### Problema 4: URL da API incorreta

**Sintoma:** Requisições indo para URL errada

**Solução:**
1. Verifique `VITE_API_URL` no `.env`
2. Rebuild o frontend: `docker compose up -d --build frontend`
3. Limpe cache do navegador

---

## Comandos Rápidos de Diagnóstico

```bash
# 1. Verificar .env
cat .env | grep -E "VITE_API_URL|APP_FRONTEND_URL"

# 2. Verificar variáveis nos containers
docker compose exec backend env | grep APP_FRONTEND_URL

# 3. Ver logs do backend
docker compose logs backend | tail -30

# 4. Verificar se containers estão rodando
docker compose ps

# 5. Rebuild completo
docker compose down && docker compose up -d --build
```

---

## Se Nada Funcionar

Envie estas informações:

1. **Conteúdo do .env** (sem senhas):
   ```bash
   cat .env | grep -v PASSWORD
   ```

2. **Logs do backend**:
   ```bash
   docker compose logs backend | tail -50
   ```

3. **Erros do console do navegador** (F12 → Console)

4. **Headers da requisição** (F12 → Network → Clique na requisição → Headers)

5. **Variáveis de ambiente do backend**:
   ```bash
   docker compose exec backend env | grep -E "APP_FRONTEND_URL|VITE"
   ```

---

## Checklist Final

- [ ] `.env` configurado com HTTPS e sem porta
- [ ] `VITE_API_URL=https://cpacessoriaecobranca.com.br`
- [ ] `APP_FRONTEND_URL=https://cpacessoriaecobranca.com.br`
- [ ] Containers rebuildados após atualizar `.env`
- [ ] Cache do navegador limpo
- [ ] Login realizado novamente
- [ ] Token JWT presente no localStorage
- [ ] Header `Authorization: Bearer <token>` sendo enviado
- [ ] Logs do backend não mostram erros de CORS

