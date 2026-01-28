# HubLead | Plataforma de Oportunidades (MVP)

> **Uma plataforma moderna para conectar compradores e fornecedores de serviços em tempo real.**

O HubLead é um marketplace de serviços B2B/B2C desenvolvido com foco em performance, arquitetura limpa e experiência do usuário (UX). O objetivo é eliminar a burocracia na contratação de serviços, permitindo que fornecedores comprem leads qualificados instantaneamente.

## 🚀 Funcionalidades Principais

O sistema conta com 3 perfis de acesso distintos com fluxos exclusivos:

### 👷 Para Fornecedores (Vendedores)

- **Mural de Oportunidades:** Visualização de demandas em tempo real.
- **Sistema de Busca Inteligente:** Filtro instantâneo por título e descrição.
- **Gestão de Créditos:** Sistema de saldo para compra de leads.
- **Compra de Lead:** Desbloqueio imediato de contatos (Telefone/Email) ao usar créditos.
- **Perfil VIP:** Lógica diferenciada para usuários patrocinadores (acesso ilimitado).

### 🛒 Para Compradores (Clientes)

- **Criação de Demandas:** Formulário simplificado para solicitar serviços.
- **Acompanhamento:** Histórico de solicitações com status (Em Análise / Aprovada).
- **Feedback Visual:** Badges de status e contadores de visualização.

### 🛡️ Para Admin (Gestão)

- **Dashboard Executivo:** Gráficos de barras (Recharts) mostrando volume mensal.
- **KPIs em Tempo Real:** Cards com total de usuários, receita estimada e demandas ativas.
- **Fluxo de Aprovação:** Moderação de demandas antes de irem para o mural.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando as tecnologias mais modernas do ecossistema React:

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estrita e segura)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes:** [Shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Banco de Dados & Auth:** [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Ícones:** [Lucide React](https://lucide.dev/)

---

## 📸 Screenshots

_(Espaço reservado para prints das telas do sistema - Admin, Comprador e Fornecedor)_

---

## 🔧 Como Rodar o Projeto

Siga os passos abaixo para rodar o projeto em sua máquina local:

### 1. Clone o repositório

```bash
git clone [https://github.com/SEU-USUARIO/HubLead.git](https://github.com/SEU-USUARIO/HubLead.git)
cd HubLead
```

### 2. Instale as depêndencias

```bash
npm install
# ou
yarn install
```

### 3. Configuração de Ambiente

Crie um arquivo .env.local na raiz do projeto e adicione suas credenciais do Firebase:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=..
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000 no seu navegador.
