# FinançasPro - Aplicativo de Orçamento Pessoal

Um aplicativo moderno, de alta performance e visualmente sofisticado para gestão financeira pessoal, desenvolvido com **Next.js (App Router)**, **Supabase (Auth + PostgreSQL + RLS)** e **Vanilla CSS** com tema escuro nativo (Obsidian Glassmorphism).

---

## 🚀 Funcionalidades Principais

- **Moeda Padrão BRL (R$)**: Valores e transações totalmente formatados no padrão brasileiro (`pt-BR`).
- **Dashboard Financeiro Inteligente**:
  - Saldo líquido, receitas totais, despesas totais e taxa de retenção/poupança em tempo real.
  - Gráfico responsivo de **Fluxo Mensal** (Receitas vs Despesas) com tooltips interativos.
  - Gráfico de **Despesas por Categoria** em formato de rosca (Doughnut) com destaques ao passar o mouse.
- **Gestão Completa de Transações (CRUD)**:
  - Criação, edição e exclusão de receitas e despesas.
  - Busca instantânea por descrição e notas adicionais.
  - Filtros por tipo (Todas, Receitas, Despesas) e por categoria.
  - Ordenação por data (mais recentes/antigas) e por valor (maior/menor).
- **Autenticação Segura via Supabase Auth**:
  - Login e Cadastro com E-mail e Senha.
  - Fluxo integrado de **Recuperação de Senha** (envio de link por e-mail e redefinição de credenciais).
  - Isolamento rigoroso de dados através de políticas **Row Level Security (RLS)** no PostgreSQL.
- **Modo Demonstração / Fallback Automático**:
  - Caso ainda não tenha inserido suas chaves do Supabase, o app executa em modo local com dados de demonstração interativos no navegador.

---

## 🛠️ Configuração do Supabase

### 1. Criar as Tabelas e Políticas de Segurança

Acesse o painel do seu projeto no Supabase, abra o **SQL Editor** e execute o script contido em:

```
supabase/schema.sql
```

Este script cria as tabelas `profiles`, `categories` e `transactions`, insere as categorias padrão do sistema e habilita as políticas RLS para garantir que cada usuário visualize apenas seus próprios lançamentos.

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

Em seguida, preencha as variáveis obtidas em **Project Settings > API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

---

## 💻 Executando o Projeto Localmente

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.
