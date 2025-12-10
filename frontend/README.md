# Frontend de Gerenciamento de Cobrança

Sistema profissional de gerenciamento de clientes, contratos e pagamentos desenvolvido em React com Chakra UI.

## 🚀 Tecnologias

- **React 18** com TypeScript
- **Chakra UI v2** - Design System e componentes
- **Context API** - Gerenciamento de estado
- **React Hook Form** - Formulários com validação
- **date-fns** - Manipulação de datas
- **jsPDF** - Geração de relatórios em PDF
- **Vite** - Build tool

## 📋 Funcionalidades

### Gerenciamento de Clientes
- ✅ Adicionar, editar e excluir clientes
- ✅ Busca por nome, CPF/CNPJ ou telefone
- ✅ Visualização completa dos dados do cliente
- ✅ Resumo financeiro (total a receber, atrasado)

### Gerenciamento de Contratos
- ✅ Criar contratos vinculados a clientes
- ✅ Editar e excluir contratos
- ✅ Geração automática de parcelas
- ✅ Visualização em tabela com todas as informações

### Gerenciamento de Pagamentos
- ✅ Acompanhamento de status (Aberto, Pago, Pago com Atraso, Atrasado)
- ✅ Marcar pagamentos como pagos
- ✅ Editar informações de pagamentos
- ✅ Visualização com badges coloridos por status
- ✅ Cálculo automático de totais

### Relatórios
- ✅ Geração de relatórios em PDF por cliente
- ✅ Inclui dados do cliente, contratos e pagamentos
- ✅ Resumo financeiro completo
- ✅ Tabelas formatadas

### UI/UX
- ✅ Interface elegante e moderna
- ✅ Layout responsivo de 3 colunas
- ✅ Confirmações para ações destrutivas
- ✅ Toasts de feedback
- ✅ Loading states
- ✅ Animações suaves

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview
```

## 📂 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ClientList.tsx
│   ├── ClientDetail.tsx
│   ├── ContractList.tsx
│   ├── PaymentList.tsx
│   ├── FilterPanel.tsx
│   └── forms/           # Formulários modais
│       ├── ClientFormModal.tsx
│       ├── ContractFormModal.tsx
│       └── PaymentFormModal.tsx
├── contexts/            # Context API
│   └── AppContext.tsx
├── data/                # Dados mockados
│   └── mockData.ts
├── types/               # TypeScript types
│   └── index.ts
├── pages/               # Páginas principais
│   └── Dashboard.tsx
├── utils/               # Funções auxiliares
│   └── reportGenerator.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 💾 Estrutura de Dados

### Cliente
```typescript
{
  cliente_id: number;
  nome: string;
  endereco: string;
  registro: string;      // CPF/CNPJ
  telefone: string;
  data_vencimento: string;
  banco: string;
}
```

### Contrato
```typescript
{
  contrato_id: number;
  cliente_id: number;
  duracao_em_meses: number;
  cpf_contratante: string;
  nome_contratante: string;
  data: string;
  valor_contrato: number;
}
```

### Pagamento
```typescript
{
  pagamento_id: number;
  contrato_id: number;
  valor: number;
  data_pagamento: string;
  data_vencimento: string;
  numero_parcela: number;
  status: 'ABERTO' | 'PAGO' | 'PAGO_COM_ATRASO' | 'ATRASADO';
  observacao?: string;
}
```

## 🎨 Layout

O sistema possui um layout de 3 colunas:

- **Coluna Esquerda**: Lista de clientes com busca
- **Coluna Central**: Detalhes do cliente e lista de contratos
- **Coluna Direita**: Lista de pagamentos do contrato selecionado

## 📝 Próximas Funcionalidades

- [ ] Integração com API backend
- [ ] Autenticação de usuários
- [ ] Filtros avançados por data e status
- [ ] Dashboard com gráficos e estatísticas
- [ ] Notificações de pagamentos vencidos
- [ ] Exportação de dados em Excel
- [ ] Envio de cobranças por email/WhatsApp

## 👨‍💻 Desenvolvido por

CP Acessoria e Cobrança

---

**Nota**: Este projeto utiliza dados mockados para demonstração. Para uso em produção, integre com uma API backend real.
