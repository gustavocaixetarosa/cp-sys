# Sistema de Gerenciamento de Cobrança

## 📋 Visão Geral do Projeto

Sistema backend desenvolvido em Java/Spring Boot para gerenciamento completo de cobranças, clientes, contratos e pagamentos. O sistema permite o cadastro de clientes, criação de contratos com geração automática de parcelas de pagamento, e controle de status de pagamentos com atualização automática de situações de inadimplência.

### Objetivo

Fornecer uma API REST robusta para gerenciamento de:
- **Clientes**: Cadastro e manutenção de informações de clientes
- **Contratos**: Criação de contratos vinculados a clientes
- **Pagamentos**: Gerenciamento automático de parcelas e controle de status

### Funcionalidades Principais

- ✅ Cadastro e gerenciamento de clientes
- ✅ Criação de contratos com vinculação a clientes
- ✅ Geração automática de parcelas de pagamento baseada na duração do contrato
- ✅ Atualização automática de status de pagamentos (atrasados, pagos, em aberto)
- ✅ Sistema de atualização diária de situações de pagamento
- ✅ API REST completa com validações
- ✅ Suporte a CORS para integração com frontend

---

## 🛠️ Stack Tecnológica

### Linguagem e Framework
- **Java 21** - Linguagem de programação
- **Spring Boot 3.4.5** - Framework principal
- **Maven** - Gerenciador de dependências

### Dependências Principais
- **Spring Data JPA** - Persistência de dados e abstração de banco
- **Spring Web** - Construção de APIs REST
- **Spring WebFlux** - Suporte a programação reativa
- **Spring Boot Validation** - Validação de dados de entrada
- **PostgreSQL 15** - Banco de dados relacional
- **H2 Database** - Banco em memória para testes (runtime)

### Infraestrutura
- **Docker** e **Docker Compose** - Containerização do banco de dados
- **PostgreSQL Driver 42.7.3** - Driver JDBC para PostgreSQL

---

## 📁 Estrutura do Projeto

O projeto segue o padrão de arquitetura em camadas (Controller-Service-Repository):

```
src/main/java/dev/gustavorosa/cobranca_cp/
├── CobrancaCpApplication.java          # Classe principal da aplicação
├── controller/                          # Camada de controle (REST)
│   ├── ClienteController.java
│   ├── ContratoController.java
│   └── PagamentoController.java
├── service/                             # Camada de lógica de negócio
│   ├── ClienteService.java
│   ├── ContratoService.java
│   ├── PagamentoService.java
│   └── AtualizacaoPagamentoService.java
├── repository/                          # Camada de acesso a dados
│   ├── ClienteRepository.java
│   ├── ContratoRepository.java
│   ├── PagamentoRepository.java
│   └── AtualizacaoRepository.java
├── model/                               # Entidades JPA
│   ├── Cliente.java
│   ├── Contrato.java
│   ├── Pagamento.java
│   ├── SituacaoPagamento.java          # Enum
│   └── Inadimplencia.java
├── dto/                                 # Data Transfer Objects
│   ├── ClienteDTO.java
│   ├── ClienteDetailsDTO.java
│   ├── ContratoDTO.java
│   ├── ContratoDetailsDTO.java
│   ├── PagamentoDTO.java
│   ├── RelatorioRequestDTO.java
│   └── RelatorioResponseDTO.java
├── factory/                             # Factory Pattern
│   └── PagamentoFactory.java
├── infra/                               # Infraestrutura
│   ├── AtualizacaoSituacaoPagamento.java
│   └── Inicializador.java              # Event Listener
└── utils/                               # Utilitários
    └── DateConverter.java
```

### Descrição das Camadas

#### Controller (Camada de Apresentação)
Responsável por receber requisições HTTP, validar entrada, delegar processamento aos serviços e retornar respostas HTTP. Todos os controllers estão configurados com CORS para permitir requisições do frontend Angular em `http://localhost:4200`.

#### Service (Camada de Negócio)
Contém a lógica de negócio da aplicação, incluindo:
- Validações de regras de negócio
- Geração automática de parcelas
- Atualização de status de pagamentos
- Orquestração de operações complexas

#### Repository (Camada de Dados)
Interfaces Spring Data JPA que abstraem o acesso ao banco de dados, fornecendo métodos CRUD e queries customizadas.

#### Model (Entidades)
Classes JPA que representam as tabelas do banco de dados, com mapeamento de relacionamentos e validações.

---

## 🗄️ Modelo de Dados

### Diagrama de Relacionamentos

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   CLIENTE   │         │  CONTRATO    │         │  PAGAMENTO   │
├─────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)     │◄──┐     │ id (PK)      │◄──┐     │ id (PK)      │
│ nome        │   │     │ cliente_id   │   │     │ contrato_id  │
│ endereco    │   │     │ nomeContrat. │   │     │ valor        │
│ telefone    │   │     │ cpfContrat.  │   │     │ dataVencim.  │
│ registro    │   │     │ duracaoMeses │   │     │ dataPagam.   │
│ banco       │   │     │ dataInicio   │   │     │ status       │
│ dataVencim. │   │     │ valorContr.  │   │     │ observacao   │
└─────────────┘   │     └──────────────┘   │     │ numeroParc.  │
                  │                        │     └──────────────┘
                  └─── OneToMany ──────────┘
                      (1:N)                └─── OneToMany ────
                                                      (1:N)
```

### Entidades Detalhadas

#### Cliente
Representa um cliente do sistema.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | Long | Identificador único | Auto-gerado |
| `nome` | String | Nome completo do cliente | Sim |
| `endereco` | String | Endereço do cliente | Não |
| `telefone` | String | Telefone de contato | Sim |
| `registro` | String | CPF ou CNPJ | Sim |
| `banco` | String | Banco do cliente | Não |
| `dataVencimentoContrato` | LocalDate | Data de vencimento do contrato | Não |
| `contratos` | List<Contrato> | Lista de contratos do cliente | Relacionamento |

**Relacionamentos:**
- `OneToMany` com `Contrato` (um cliente pode ter vários contratos)

#### Contrato
Representa um contrato vinculado a um cliente.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | Long | Identificador único | Auto-gerado |
| `cliente` | Cliente | Cliente proprietário do contrato | Sim |
| `nomeContratante` | String | Nome do contratante | Sim |
| `cpfContratante` | String | CPF do contratante | Não |
| `duracaoEmMeses` | Integer | Duração do contrato em meses | Sim |
| `dataInicioContrato` | LocalDate | Data de início do contrato | Sim |
| `valorContrato` | Double | Valor total do contrato | Sim |
| `pagamentos` | List<Pagamento> | Lista de pagamentos/parcelas | Relacionamento |

**Relacionamentos:**
- `ManyToOne` com `Cliente` (muitos contratos pertencem a um cliente)
- `OneToMany` com `Pagamento` (um contrato tem várias parcelas)

#### Pagamento
Representa uma parcela de pagamento de um contrato.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | Long | Identificador único | Auto-gerado |
| `contrato` | Contrato | Contrato ao qual pertence | Sim |
| `valor` | Double | Valor da parcela | Sim |
| `dataVencimento` | LocalDate | Data de vencimento | Sim |
| `dataPagamento` | LocalDate | Data em que foi pago | Não |
| `status` | SituacaoPagamento | Status atual do pagamento | Auto-calculado |
| `observacao` | String | Observações sobre o pagamento | Não |
| `numeroParcela` | Integer | Número da parcela | Sim |

**Relacionamentos:**
- `ManyToOne` com `Contrato` (muitos pagamentos pertencem a um contrato)

**Lógica de Status:**
O status é calculado automaticamente através do método `verificarStatus()`:
- **EM_ABERTO**: Pagamento não foi pago e ainda não venceu
- **ATRASADO**: Pagamento não foi pago e já passou da data de vencimento
- **PAGO**: Pagamento foi realizado até a data de vencimento
- **PAGO_COM_ATRASO**: Pagamento foi realizado após a data de vencimento

#### SituacaoPagamento (Enum)
Enum que representa os possíveis status de um pagamento:
- `EM_ABERTO`
- `PAGO`
- `ATRASADO`
- `PAGO_COM_ATRASO`

---

## 🔌 API REST - Documentação Completa

### Base URL
```
http://localhost:8080
```

### Configuração CORS
Todos os endpoints estão configurados para aceitar requisições do frontend Angular em:
```
http://localhost:4200
```

### Endpoints

#### Clientes (`/clientes`)

##### POST `/clientes` - Criar Cliente
Cria um novo cliente no sistema.

**Request Body:**
```json
{
  "nome": "João Silva",
  "endereco": "Rua Exemplo, 123",
  "telefone": "(11) 98765-4321",
  "dataContrato": "2024-01-15",
  "registro": "123.456.789-00",
  "banco": "Banco do Brasil"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "nome": "João Silva",
  "endereco": "Rua Exemplo, 123",
  "telefone": "(11) 98765-4321",
  "dataContrato": "2024-01-15",
  "registro": "123.456.789-00",
  "banco": "Banco do Brasil",
  "contratos": null
}
```

**Validações:**
- `nome`: Obrigatório, não pode estar vazio
- `telefone`: Obrigatório
- `registro`: Obrigatório (CPF ou CNPJ)

##### GET `/clientes` - Listar Todos os Clientes
Retorna uma lista com todos os clientes cadastrados.

**Response:** `200 OK`
```json
[
  {
    "cliente_id": 1,
    "nome": "João Silva",
    "endereco": "Rua Exemplo, 123",
    "telefone": "(11) 98765-4321",
    "registro": "123.456.789-00",
    "banco": "Banco do Brasil"
  }
]
```

**Erro:** `500 Internal Server Error` - Se nenhum cliente for encontrado

##### GET `/clientes/{id}` - Buscar Cliente por ID
Retorna os detalhes de um cliente específico.

**Path Parameters:**
- `id` (Long) - ID do cliente

**Response:** `200 OK`
```json
{
  "cliente_id": 1,
  "nome": "João Silva",
  "endereco": "Rua Exemplo, 123",
  "telefone": "(11) 98765-4321",
  "registro": "123.456.789-00",
  "banco": "Banco do Brasil"
}
```

**Erro:** `500 Internal Server Error` - Se o cliente não for encontrado

##### DELETE `/clientes/{id}` - Excluir Cliente
Remove um cliente do sistema. Também remove todos os contratos associados (cascade).

**Path Parameters:**
- `id` (Long) - ID do cliente

**Response:** `200 OK` (sem body)

**Erro:** `500 Internal Server Error` - Se o cliente não for encontrado

---

#### Contratos (`/contratos`)

##### POST `/contratos` - Criar Contrato
Cria um novo contrato vinculado a um cliente. **Automaticamente gera as parcelas de pagamento** baseadas na duração do contrato.

**Request Body:**
```json
{
  "clienteId": 1,
  "nomeContratante": "João Silva",
  "cpfContratante": "123.456.789-00",
  "duracaoEmMeses": 12,
  "dataInicioContrato": "2024-01-15",
  "dataPrimeiraParcela": "2024-02-15",
  "valorContrato": 12000.00
}
```

**Response:** `201 Created`
```json
{
  "contrato_id": 1,
  "cliente_id": 1,
  "duracao_em_meses": 12,
  "cpf_contratante": "123.456.789-00",
  "nome_contratante": "João Silva",
  "data": "2024-01-15",
  "valor_contrato": 12000.00
}
```

**Validações:**
- `clienteId`: Obrigatório
- `nomeContratante`: Obrigatório, não pode estar vazio
- `duracaoEmMeses`: Obrigatório
- `dataInicioContrato`: Obrigatório
- `dataPrimeiraParcela`: Obrigatório
- `valorContrato`: Obrigatório

**Comportamento:**
- Cria o contrato vinculado ao cliente especificado
- Gera automaticamente `duracaoEmMeses` parcelas de pagamento
- Cada parcela tem valor = `valorContrato / duracaoEmMeses`
- As datas de vencimento são geradas mensalmente a partir de `dataPrimeiraParcela`
- O status inicial de cada parcela é calculado automaticamente

##### GET `/contratos` - Listar Todos os Contratos
Retorna uma lista com todos os contratos cadastrados.

**Response:** `200 OK`
```json
[
  {
    "contrato_id": 1,
    "cliente_id": 1,
    "duracao_em_meses": 12,
    "cpf_contratante": "123.456.789-00",
    "nome_contratante": "João Silva",
    "data": "2024-01-15",
    "valor_contrato": 12000.00
  }
]
```

**Erro:** `500 Internal Server Error` - Se nenhum contrato for encontrado

##### GET `/contratos/{id}` - Buscar Contrato por ID
Retorna os detalhes de um contrato específico.

**Path Parameters:**
- `id` (Long) - ID do contrato

**Response:** `200 OK`
```json
{
  "contrato_id": 1,
  "cliente_id": 1,
  "duracao_em_meses": 12,
  "cpf_contratante": "123.456.789-00",
  "nome_contratante": "João Silva",
  "data": "2024-01-15",
  "valor_contrato": 12000.00
}
```

**Erro:** `500 Internal Server Error` - Se o contrato não for encontrado

---

#### Pagamentos (`/pagamentos`)

##### GET `/pagamentos` - Listar Todos os Pagamentos
Retorna uma lista com todos os pagamentos/parcelas cadastrados.

**Response:** `200 OK`
```json
[
  {
    "pagamento_id": 1,
    "contrato_id": 1,
    "valor": 1000.00,
    "data_pagamento": "",
    "data_vencimento": "2024-02-15",
    "status": "EM_ABERTO",
    "observacao": null,
    "numero_parcela": 1
  },
  {
    "pagamento_id": 2,
    "contrato_id": 1,
    "valor": 1000.00,
    "data_pagamento": "2024-03-10",
    "data_vencimento": "2024-03-15",
    "status": "PAGO",
    "observacao": "Pago via PIX",
    "numero_parcela": 2
  }
]
```

**Erro:** `500 Internal Server Error` - Se nenhum pagamento for encontrado

##### PUT `/pagamentos/{id}` - Atualizar Pagamento
Atualiza as informações de um pagamento. Ao atualizar, o status é recalculado automaticamente.

**Path Parameters:**
- `id` (Long) - ID do pagamento

**Request Body:**
```json
{
  "pagamento_id": 1,
  "contrato_id": 1,
  "valor": 1000.00,
  "data_pagamento": "2024-02-20",
  "data_vencimento": "2024-02-15",
  "status": "PAGO_COM_ATRASO",
  "observacao": "Pago com atraso de 5 dias",
  "numero_parcela": 1
}
```

**Response:** `200 OK`
```json
{
  "pagamento_id": 1,
  "contrato_id": 1,
  "valor": 1000.00,
  "data_pagamento": "2024-02-20",
  "data_vencimento": "2024-02-15",
  "status": "PAGO_COM_ATRASO",
  "observacao": "Pago com atraso de 5 dias",
  "numero_parcela": 1
}
```

**Comportamento:**
- Atualiza os campos do pagamento
- Recalcula automaticamente o status baseado em `dataPagamento` e `dataVencimento`
- Se `dataPagamento` for informada e for após `dataVencimento`, status será `PAGO_COM_ATRASO`
- Se `dataPagamento` for informada e for antes ou igual a `dataVencimento`, status será `PAGO`
- Se `dataPagamento` não for informada e `dataVencimento` já passou, status será `ATRASADO`
- Se `dataPagamento` não for informada e `dataVencimento` ainda não chegou, status será `EM_ABERTO`

**Erro:** `500 Internal Server Error` - Se o pagamento não for encontrado

---

## ⚙️ Funcionalidades Principais

### 1. Gerenciamento de Clientes
- Cadastro completo de clientes com validações
- Consulta de clientes por ID ou listagem completa
- Exclusão de clientes (com remoção em cascata de contratos)

### 2. Gerenciamento de Contratos
- Criação de contratos vinculados a clientes
- Validação de dados obrigatórios
- Consulta de contratos

### 3. Geração Automática de Parcelas
Quando um contrato é criado, o sistema automaticamente:
- Calcula o valor de cada parcela: `valorContrato / duracaoEmMeses`
- Gera as datas de vencimento mensais a partir da data da primeira parcela
- Cria todas as parcelas com status inicial calculado automaticamente
- Numera as parcelas sequencialmente (1, 2, 3, ...)

### 4. Atualização Automática de Status
O sistema possui um mecanismo de atualização automática que:
- É executado na inicialização da aplicação (`Inicializador`)
- Verifica se já foi executado hoje (evita execuções duplicadas)
- Atualiza o status de todos os pagamentos vencidos e não pagos para `ATRASADO`
- Registra a data da última atualização para controle

### 5. Cálculo Inteligente de Status
O status de cada pagamento é calculado automaticamente considerando:
- Data de vencimento
- Data de pagamento (se houver)
- Data atual do sistema

---

## 🚀 Configuração e Setup

### Requisitos do Sistema

- **Java 21** ou superior
- **Maven 3.6+**
- **Docker** e **Docker Compose** (para o banco de dados)
- **PostgreSQL 15** (ou usar o container Docker)

### Configuração do Banco de Dados

#### Opção 1: Usando Docker Compose (Recomendado)

1. **Iniciar o container PostgreSQL:**
```bash
docker-compose up -d
```

2. **Verificar se o container está rodando:**
```bash
docker ps
```

3. **Parar o container:**
```bash
docker-compose down
```

4. **Parar e remover volumes (apaga dados):**
```bash
docker-compose down -v
```

O `docker-compose.yml` já está configurado com:
- Database: `cobranca`
- Usuário: `gustavo`
- Senha: `139150`
- Porta: `5432`

#### Opção 2: PostgreSQL Local

Se preferir usar um PostgreSQL local, ajuste o `application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cobranca
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
```

### Configuração do application.properties

O arquivo `src/main/resources/application.properties` contém:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cobranca
spring.datasource.username=gustavo
spring.datasource.password=139150
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show=true
```

**Configurações importantes:**
- `spring.jpa.hibernate.ddl-auto=update`: Atualiza automaticamente o schema do banco
- `spring.jpa.show=true`: Exibe as queries SQL no console (útil para debug)

### Executando a Aplicação

#### 1. Compilar o projeto:
```bash
mvn clean install
```

#### 2. Executar a aplicação:
```bash
mvn spring-boot:run
```

Ou executar diretamente a classe `CobrancaCpApplication`.

#### 3. Verificar se está rodando:
A aplicação estará disponível em:
```
http://localhost:8080
```

### Testando a API

Você pode testar os endpoints usando:
- **Postman**
- **cURL**
- **Insomnia**
- **Frontend Angular** (se configurado em `http://localhost:4200`)

**Exemplo com cURL:**
```bash
# Criar um cliente
curl -X POST http://localhost:8080/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telefone": "(11) 98765-4321",
    "registro": "123.456.789-00"
  }'
```

---

## 🏗️ Arquitetura e Padrões

### Camadas da Aplicação

O projeto segue o padrão de arquitetura em camadas:

```
┌─────────────────────────────────────┐
│         Controller Layer             │  ← Recebe requisições HTTP
│  (ClienteController, etc.)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Service Layer              │  ← Lógica de negócio
│  (ClienteService, etc.)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Repository Layer              │  ← Acesso a dados
│  (ClienteRepository, etc.)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database (PostgreSQL)        │
└─────────────────────────────────────┘
```

### Injeção de Dependências

O projeto utiliza injeção de dependências do Spring através de:
- `@Autowired` em campos ou construtores
- `@Service`, `@Repository`, `@Component` para registro de beans

### Transações

Operações que modificam múltiplas entidades utilizam `@Transactional` para garantir consistência:
- `AtualizacaoPagamentoService.atualizarSituacaoSeNecessario()`
- `PagamentoService.atualizarPagamento()`

### Event Listeners

O sistema utiliza o padrão de Event Listener do Spring:
- `Inicializador`: Escuta o evento `ApplicationReadyEvent` e executa a atualização de status de pagamentos na inicialização da aplicação

### Factory Pattern

O projeto utiliza o padrão Factory para criação de objetos complexos:
- `PagamentoFactory`: Converte DTOs em entidades `Pagamento`, realizando validações e conversões de dados

### Validações

Validações são realizadas em múltiplas camadas:
- **DTOs**: Utilizam `@NotBlank`, `@NotNull` do Jakarta Validation
- **Entidades**: Validações JPA com `@NotNull`
- **Services**: Validações de regras de negócio e tratamento de erros

### Tratamento de Erros

O sistema utiliza `RuntimeException` para tratamento de erros:
- Cliente não encontrado
- Contrato não encontrado
- Pagamento não encontrado
- Listas vazias

**Nota:** Para produção, recomenda-se implementar um `@ControllerAdvice` para tratamento centralizado de exceções e retorno de respostas HTTP apropriadas.

---

## 📦 Dependências e Bibliotecas

### Dependências do pom.xml

```xml
<dependencies>
    <!-- Spring Boot Starter Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter WebFlux -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- H2 Database (Runtime) -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <version>42.7.3</version>
    </dependency>
    
    <!-- Spring Boot Starter Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Propósito das Dependências Principais

| Dependência | Propósito |
|-------------|-----------|
| `spring-boot-starter-data-jpa` | Abstração de acesso a dados, JPA, Hibernate |
| `spring-boot-starter-validation` | Validação de dados de entrada (Bean Validation) |
| `spring-boot-starter-web` | Construção de APIs REST, servlet container |
| `spring-boot-starter-webflux` | Suporte a programação reativa (WebFlux) |
| `postgresql` | Driver JDBC para conexão com PostgreSQL |
| `h2` | Banco em memória para testes (runtime) |
| `spring-boot-starter-test` | Ferramentas de teste (JUnit, Mockito, etc.) |

---

## 🔄 Fluxo de Funcionamento

### Fluxo de Criação de Contrato

1. Cliente envia requisição POST para `/contratos` com dados do contrato
2. `ContratoController` recebe e valida o DTO
3. `ContratoService` busca o cliente pelo ID
4. `ContratoService` cria a entidade `Contrato`
5. `PagamentoService` gera automaticamente as parcelas:
   - Calcula valor por parcela
   - Gera datas de vencimento mensais
   - Cria entidades `Pagamento` com status inicial
6. Contrato e pagamentos são salvos no banco
7. Resposta é retornada ao cliente

### Fluxo de Atualização de Status

1. Aplicação inicia (`ApplicationReadyEvent`)
2. `Inicializador` detecta o evento
3. `AtualizacaoPagamentoService` verifica se já foi executado hoje
4. Se não, busca todos os pagamentos vencidos e não pagos
5. Atualiza status para `ATRASADO`
6. Salva a data da atualização
7. Processo concluído

---

## 📝 Notas Importantes

### Segurança
- ⚠️ As credenciais do banco de dados estão expostas no `application.properties` e `docker-compose.yml`
- ⚠️ Para produção, utilize variáveis de ambiente ou um gerenciador de secrets
- ⚠️ Implemente autenticação e autorização se necessário

### Melhorias Futuras Sugeridas
- Implementar tratamento centralizado de exceções com `@ControllerAdvice`
- Adicionar paginação nas listagens
- Implementar filtros e busca avançada
- Adicionar logs estruturados
- Implementar testes unitários e de integração
- Adicionar documentação Swagger/OpenAPI
- Implementar cache para consultas frequentes
- Adicionar suporte a múltiplos ambientes (dev, prod)

---

## 📄 Licença

Este projeto é privado e de uso interno.

---

## 👤 Autor

Desenvolvido por Gustavo Rosa

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

