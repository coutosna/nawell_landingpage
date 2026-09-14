# NAWELL Tax Compliance — Frontend

Plataforma web de análise fiscal (EFD Contribuições, ECF, eSocial e Reforma Tributária), incluindo motor de validação de NF-e contra tabelas oficiais.

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind (SPA)
- **Backend de auth:** Node.js + Express (JWT em cookie httpOnly + bcrypt)
- **Testes:** Vitest

## Como rodar em desenvolvimento

O frontend é desenvolvido com Vite:

```bash
npm install
npm run dev        # Vite dev server em http://localhost:8080
```

> O auth server-side exige o servidor Express. Em desenvolvimento isolado do Vite, use o proxy abaixo ou o fluxo de "modo produção".

## Como rodar em produção (com auth)

O produto é entregue pelo servidor Express, que valida sessão (cookie httpOnly) e serve o build estático.

```bash
# 1. Instalar dependências
npm install

# 2. Gerar o build estático
npm run build

# 3. Configurar variáveis de ambiente (copie .env.example para .env)
cp .env.example .env

# 4. Gerar o hash da senha de cada usuário interno
npm run hash-password "suaSenhaForte"

# 5. Preencher AUTH_USERS no .env com o hash gerado e ajustar
#    JWT_SECRET (segredo forte e aleatório) e COOKIE_SECURE=true (HTTPS)

# 6. Iniciar o servidor
npm start          # ou: npm run start:dev (com reload)
```

O servidor sobe na porta `8080` (ou `PORT`) e serve o SPA em todas as rotas, protegendo os endpoints `/api/auth/*`.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão `8080`) |
| `JWT_SECRET` | Segredo para assinar o token de sessão |
| `SESSION_HOURS` | Duração da sessão em horas (padrão `12`) |
| `COOKIE_SECURE` | `true` em produção (HTTPS), `false` em dev (HTTP) |
| `AUTH_USERS` | JSON com lista de usuários e `passwordHash` bcrypt |

## Autenticação

- Login em `POST /api/auth/login` — valida credenciais e emite JWT em cookie `httpOnly`.
- `GET /api/auth/me` — retorna o usuário da sessão atual (401 se não autenticado).
- `POST /api/auth/logout` — invalida a sessão.
- O `ProtectedRoute` no frontend redireciona para o login quando não há sessão.

## Testes

```bash
npm run test
```

## Estrutura relevante

| Caminho | Descrição |
|---|---|
| `src/` | Código-fonte da aplicação (parser EFD/ECF, validação NF-e, UI) |
| `src/contexts/AuthContext.tsx` | Estado de autenticação do frontend (via `/api/auth`) |
| `server/` | Servidor Express: auth, sessão e servir do build (`server/index.js`) |
| `src/data/oficial/` | Tabelas oficiais curadas (NCM, CFOP, CST/cClassTrib, CNAE) |
| `src/test/fixtures/` | Fixtures de teste do parser EFD |

## Deploy

- **Railway/Fly (container Node):** `npm run build` + `npm start`, expondo a porta.
- **VPS:** `npm run build` + `npm start` atrás de Nginx/HTTPS com `COOKIE_SECURE=true`.
- Não é compatível com hospedagem estática pura (ex.: Netlify/Vercel static) sem adaptar o backend de auth.
