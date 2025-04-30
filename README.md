# Sistema de Gerenciamento - Dellas Cabelo & Pele

Sistema de gerenciamento para salão de beleza Dellas - Cabelo & Pele, otimizado para melhorar operações e experiência de gestão com foco em agendamentos e controle financeiro.

## Funcionalidades

- Agendamento de clientes com gerenciamento de status detalhado
- Controle financeiro e rastreamento de pagamentos
- Gestão avançada de clientes e serviços
- Filtros dinâmicos e paginação de dados

## Tecnologias

- React (Vite)
- Express
- Supabase
- PostgreSQL
- TailwindCSS
- Zod para validação
- Drizzle ORM

## Configuração para Desenvolvimento Local

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Copie o arquivo `.env.example` para `.env.local` e configure as variáveis de ambiente:
   ```
   DATABASE_URL=postgres://usuario:senha@host:porta/nome_banco
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_KEY=sua_chave_do_supabase
   ```
4. Execute `npm run dev` para iniciar o servidor de desenvolvimento

## Deployment no Vercel

### Pré-requisitos
- Conta na Vercel
- Projeto configurado no Supabase

### Passos para deploy

1. Faça login na Vercel e crie um novo projeto
2. Conecte ao repositório do GitHub onde está o projeto
3. Configure as variáveis de ambiente na Vercel:
   - `DATABASE_URL`: URL de conexão do PostgreSQL
   - `SUPABASE_URL`: URL do seu projeto no Supabase
   - `SUPABASE_KEY`: Chave de API do Supabase
   - `NODE_ENV`: Defina como "production"

4. O projeto está configurado para funcionar como uma aplicação moderna na Vercel:
   - O frontend é servido como arquivos estáticos
   - O backend é implementado como Edge Functions, que oferecem melhor desempenho e compatibilidade

### Estrutura de Arquivos para Deploy
- `vercel.json`: Configura como o projeto deve ser construído e implantado
- `api/index.js`: Implementa a Edge Function para API com alta performance
- `vercel-build.sh`: Script personalizado para construir a aplicação

### Detalhes da Implementação para Vercel

#### Edge Functions

O aplicativo utiliza Edge Functions da Vercel em vez de funções serverless tradicionais. Isso proporciona:

- **Menor latência**: As funções são executadas mais próximas do usuário
- **Melhor compatibilidade**: Adaptado para o modelo de runtime da Vercel
- **Sem servidor persistente**: Eliminação da dependência de Express.listen()
- **Melhor escalabilidade**: Escala automaticamente com o tráfego

#### Adaptação do Banco de Dados

As conexões com o Supabase são gerenciadas dinamicamente para funcionar com o modelo stateless das Edge Functions. O arquivo `api/index.js` implementa:

- Inicialização lazy do banco de dados
- Gerenciamento de conexões compatível com runtime serverless
- Cache eficiente de conexões entre chamadas de função

### Notas de Implementação
- Os status dos agendamentos são traduzidos em português:
  - Quando agendado: `payment_status: null, status: agendado`
  - Quando cancelado: `payment_status: null, status: cancelado`
  - Quando pagamento confirmado: `payment_status: pago, status: finalizado`
  - Quando confirmado com pagamento pendente: `payment_status: pendente, status: pagamento pendente`