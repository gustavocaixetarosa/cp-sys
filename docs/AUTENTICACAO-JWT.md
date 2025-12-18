# 🔐 Sistema de Autenticação JWT - Documentação Completa

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Backend - Spring Boot](#backend---spring-boot)
4. [Frontend - React](#frontend---react)
5. [Fluxo de Autenticação](#fluxo-de-autenticação)
6. [Como Usar](#como-usar)
7. [Segurança](#segurança)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Este documento explica a implementação completa de um sistema de autenticação JWT (JSON Web Tokens) com:

- ✅ **Login e Registro** de usuários
- ✅ **JWT Token** (1 hora de validade)
- ✅ **Refresh Token** (7 dias de validade)
- ✅ **Roles** (ADMIN e USER)
- ✅ **Proteção de rotas** no frontend e backend
- ✅ **Renovação automática** de tokens expirados
- ✅ **Senha criptografada** com BCrypt
- ✅ **Usuário admin padrão** criado automaticamente

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AuthContext (Gerencia estado de autenticação)      │   │
│  │  - user, isAuthenticated, login(), logout()          │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Axios Interceptors                                  │   │
│  │  - Adiciona token automaticamente                    │   │
│  │  - Renova token se expirado (401)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                HTTP + JWT Token
                          │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Spring Boot)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  JwtAuthenticationFilter                             │   │
│  │  - Intercepta todas as requisições                   │   │
│  │  - Valida o JWT Token                                │   │
│  │  - Configura SecurityContext                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SecurityConfig                                      │   │
│  │  - /auth/** → Público                                │   │
│  │  - /** → Requer autenticação                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Controllers → Services → Repository → Database      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend - Spring Boot

### 1. Dependências Adicionadas

```xml
<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- JWT (jjwt) -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
```

### 2. Estrutura de Arquivos Criados

```
backend/src/main/java/dev/gustavorosa/cobranca_cp/
├── model/
│   ├── Usuario.java          # Entidade de usuário (implementa UserDetails)
│   └── Role.java              # Enum com roles (ADMIN, USER)
├── repository/
│   └── UsuarioRepository.java # Repository para Usuario
├── dto/
│   ├── LoginRequest.java      # DTO para login
│   ├── RegisterRequest.java   # DTO para registro
│   ├── AuthResponse.java      # DTO de resposta (token + user)
│   └── RefreshTokenRequest.java
├── security/
│   ├── JwtTokenProvider.java         # Gera e valida JWT
│   ├── JwtAuthenticationFilter.java  # Intercepta requests
│   └── SecurityConfig.java           # Configuração do Spring Security
├── service/
│   ├── UsuarioService.java    # UserDetailsService
│   └── AuthService.java       # Lógica de login/register
└── controller/
    └── AuthController.java    # Endpoints /auth/login, /auth/register, /auth/refresh
```

### 3. Componentes Principais

#### 3.1 Usuario.java (Model)
- Implementa `UserDetails` do Spring Security
- Campos: id, nome, email, senha (BCrypt), role, ativo, dataCriacao
- Roles: `ADMIN` ou `USER`

#### 3.2 JwtTokenProvider.java
**Responsabilidade:** Gerar e validar JWT Tokens

```java
// Gera token de acesso (1 hora)
public String generateToken(Usuario usuario)

// Gera refresh token (7 dias)
public String generateRefreshToken(Usuario usuario)

// Extrai email do token
public String getEmailFromToken(String token)

// Valida token
public boolean validateToken(String token)
```

**Configuração (application.yml):**
```yaml
app:
  jwt:
    secret: ${JWT_SECRET:chave-secreta-base64}
    expiration: 3600000      # 1 hora em ms
    refresh-expiration: 604800000  # 7 dias em ms
```

#### 3.3 JwtAuthenticationFilter.java
**Responsabilidade:** Interceptar todas as requisições HTTP

```java
@Override
protected void doFilterInternal(request, response, filterChain) {
    1. Extrai JWT do header Authorization
    2. Valida o token
    3. Carrega o usuário do banco
    4. Configura SecurityContext
    5. Continua o filter chain
}
```

#### 3.4 SecurityConfig.java
**Responsabilidade:** Configuração central de segurança

```java
// Rotas públicas
.requestMatchers("/auth/**").permitAll()

// Rotas protegidas
.anyRequest().authenticated()

// Session stateless (não guarda sessão)
.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
```

#### 3.5 AuthService.java
**Responsabilidade:** Lógica de autenticação

```java
// Login: valida credenciais e gera tokens
public AuthResponse login(LoginRequest request)

// Registro: cria novo usuário
public AuthResponse register(RegisterRequest request)

// Refresh: renova tokens
public AuthResponse refreshToken(String refreshToken)
```

#### 3.6 AuthController.java
**Endpoints:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login (retorna token + refreshToken) |
| POST | `/auth/register` | Criar conta |
| POST | `/auth/refresh` | Renovar tokens |

### 4. Fluxo de Requisição Protegida

```
1. Cliente faz request com header:
   Authorization: Bearer eyJhbGc...

2. JwtAuthenticationFilter intercepta
   - Extrai token do header
   - Valida token
   - Se válido: adiciona user no SecurityContext
   - Se inválido: retorna 401

3. Controller executa
   - Tem acesso ao usuário autenticado via SecurityContext

4. Response retorna ao cliente
```

### 5. Usuário Admin Padrão

No `Inicializador.java`, um usuário admin é criado automaticamente:

```
Email: admin@cobranca.com
Senha: admin123
Role: ADMIN
```

⚠️ **IMPORTANTE**: Alterar a senha em produção!

---

## Frontend - React

### 1. Dependências Adicionadas

```json
{
  "react-router-dom": "^6.28.0",
  "@types/react-router-dom": "^5.3.3"
}
```

### 2. Estrutura de Arquivos Criados

```
frontend/src/
├── contexts/
│   └── AuthContext.tsx        # Context de autenticação
├── pages/
│   └── LoginPage.tsx          # Página de login/registro
├── components/
│   └── ProtectedRoute.tsx     # Componente para proteger rotas
└── services/
    └── api.ts                 # Axios com interceptors (atualizado)
```

### 3. Componentes Principais

#### 3.1 AuthContext.tsx
**Responsabilidade:** Gerenciar estado global de autenticação

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials) => Promise<void>;
  register: (credentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

**Funcionalidades:**
- Armazena `token`, `refreshToken` e `user` no localStorage
- Configura header Authorization no Axios
- Inicializa auth state ao carregar a página
- Gerencia login, logout e registro

#### 3.2 LoginPage.tsx
**Responsabilidade:** Interface de login e registro

**Recursos:**
- Toggle entre Login e Criar Conta
- Validação de formulário
- Mostra credenciais padrão do admin
- Feedback visual de erros
- Redireciona após login bem-sucedido

#### 3.3 ProtectedRoute.tsx
**Responsabilidade:** Proteger rotas que requerem autenticação

```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

**Comportamento:**
- Se não autenticado → redireciona para `/login`
- Se autenticado → renderiza o componente filho
- Mostra loading durante verificação

#### 3.4 Axios Interceptors (api.ts)

**Request Interceptor:**
```typescript
// Adiciona token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor:**
```typescript
// Trata erro 401 (token expirado)
api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Tenta renovar o token automaticamente
      // Se falhar, redireciona para login
    }
  }
);
```

#### 3.5 App.tsx (Atualizado)
**Estrutura de rotas:**

```typescript
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppProvider>
              <Dashboard />
            </AppProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

---

## Fluxo de Autenticação

### 1. Primeiro Acesso (Login)

```
┌──────────┐                                 ┌──────────┐
│ Frontend │                                 │ Backend  │
└────┬─────┘                                 └────┬─────┘
     │                                            │
     │  POST /auth/login                          │
     │  { email, senha }                          │
     ├───────────────────────────────────────────>│
     │                                            │
     │                                            │  1. Valida credenciais
     │                                            │  2. Gera JWT + Refresh Token
     │                                            │  3. Retorna tokens + user
     │                                            │
     │  { token, refreshToken, usuario }          │
     │<───────────────────────────────────────────┤
     │                                            │
     │  4. Salva no localStorage                  │
     │  5. Configura header Authorization         │
     │  6. Atualiza state (user)                  │
     │  7. Redireciona para Dashboard             │
     │                                            │
```

### 2. Requisição Protegida

```
┌──────────┐                                 ┌──────────┐
│ Frontend │                                 │ Backend  │
└────┬─────┘                                 └────┬─────┘
     │                                            │
     │  GET /clientes                             │
     │  Authorization: Bearer <token>             │
     ├───────────────────────────────────────────>│
     │                                            │
     │                                            │  1. JwtFilter intercepta
     │                                            │  2. Valida token
     │                                            │  3. Carrega usuário
     │                                            │  4. Executa controller
     │                                            │
     │  { ... clientes ... }                      │
     │<───────────────────────────────────────────┤
     │                                            │
```

### 3. Token Expirado (Renovação Automática)

```
┌──────────┐                                 ┌──────────┐
│ Frontend │                                 │ Backend  │
└────┬─────┘                                 └────┬─────┘
     │                                            │
     │  GET /clientes                             │
     │  Authorization: Bearer <token-expirado>    │
     ├───────────────────────────────────────────>│
     │                                            │
     │                                            │  Token expirado!
     │  401 Unauthorized                          │
     │<───────────────────────────────────────────┤
     │                                            │
     │  Interceptor detecta 401                   │
     │                                            │
     │  POST /auth/refresh                        │
     │  { refreshToken }                          │
     ├───────────────────────────────────────────>│
     │                                            │
     │                                            │  Valida refresh token
     │                                            │  Gera novos tokens
     │                                            │
     │  { token, refreshToken }                   │
     │<───────────────────────────────────────────┤
     │                                            │
     │  Salva novos tokens                        │
     │  Retry request original                    │
     │                                            │
     │  GET /clientes (retry)                     │
     │  Authorization: Bearer <novo-token>        │
     ├───────────────────────────────────────────>│
     │                                            │
     │  { ... clientes ... }                      │
     │<───────────────────────────────────────────┤
     │                                            │
```

---

## Como Usar

### 1. Build e Deploy

```bash
# Na raiz do projeto
cd /home/gustavorosa/cp-sys

# Rebuild os containers
docker compose down
docker compose up -d --build
```

### 2. Primeiro Acesso

1. Abra o navegador em `http://seu-ip-vps` ou `http://localhost`
2. Você verá a tela de login
3. Use as credenciais padrão:
   - **Email**: `admin@cobranca.com`
   - **Senha**: `admin123`
4. Após login, você será redirecionado para o Dashboard

### 3. Criar Nova Conta

1. Na tela de login, clique em "Criar conta"
2. Preencha: Nome, Email, Senha (mínimo 6 caracteres)
3. Novas contas são criadas como `USER` (não `ADMIN`)

### 4. Logout

1. No Dashboard, clique no avatar no canto inferior esquerdo
2. Selecione "Sair"
3. Você será redirecionado para a tela de login

---

## Segurança

### ✅ Medidas Implementadas

1. **Senha Criptografada**: BCrypt com salt
2. **JWT Assinado**: Tokens não podem ser falsificados
3. **Tokens de Curta Duração**: 1 hora para access token
4. **HTTPS Recomendado**: Use HTTPS em produção
5. **CORS Configurado**: Apenas origens permitidas
6. **Stateless**: Não armazena sessões no servidor

### ⚠️ Recomendações para Produção

1. **Altere a Senha Admin**:
   ```sql
   UPDATE usuarios 
   SET senha = 'novo-hash-bcrypt' 
   WHERE email = 'admin@cobranca.com';
   ```

2. **Use Variáveis de Ambiente para JWT Secret**:
   ```yaml
   app:
     jwt:
       secret: ${JWT_SECRET}  # Configure no .env
   ```

3. **Configure HTTPS**:
   - Use Nginx como proxy reverso
   - Configure certificado SSL (Let's Encrypt)

4. **Limite de Taxa (Rate Limiting)**:
   - Implemente proteção contra brute force

5. **Logs de Auditoria**:
   - Registre tentativas de login
   - Monitore acessos suspeitos

---

## Troubleshooting

### Problema: "401 Unauthorized" ao acessar rotas

**Causa**: Token ausente ou inválido

**Solução**:
1. Verifique se o token está no localStorage
2. Faça logout e login novamente
3. Verifique o console do navegador para erros

### Problema: Token expira muito rápido

**Solução**: Aumente o tempo de expiração em `application.yml`:
```yaml
app:
  jwt:
    expiration: 7200000  # 2 horas em ms
```

### Problema: CORS ao fazer login

**Solução**: Verifique se `APP_FRONTEND_URL` está correto no `.env`:
```bash
APP_FRONTEND_URL=http://seu-ip-vps
```

### Problema: Refresh token não funciona

**Causa**: Refresh token expirado (7 dias)

**Solução**: Faça login novamente

### Problema: "No refresh token" no console

**Causa**: localStorage foi limpo

**Solução**: Faça login novamente

---

## Resumo

✅ **Backend**:
- Spring Security + JWT
- Endpoints: `/auth/login`, `/auth/register`, `/auth/refresh`
- Usuário admin criado automaticamente
- Todas as rotas protegidas exceto `/auth/**`

✅ **Frontend**:
- React Router para navegação
- AuthContext para estado global
- ProtectedRoute para rotas privadas
- Axios Interceptors para tokens automáticos
- Renovação automática de tokens expirados

✅ **Segurança**:
- Senhas criptografadas (BCrypt)
- JWT com expiração
- Refresh tokens
- Proteção CORS

---

## Próximos Passos Sugeridos

1. ✨ **Recuperação de Senha**: Implementar reset via email
2. ✨ **Perfil de Usuário**: Página para alterar dados
3. ✨ **2FA**: Autenticação de dois fatores
4. ✨ **Logs de Acesso**: Auditoria de logins
5. ✨ **Permissões Granulares**: Controle fino por role

---

**Documentação criada em**: Dezembro 2025  
**Versão**: 1.0  
**Autor**: Sistema de Cobrança - Implementação JWT

