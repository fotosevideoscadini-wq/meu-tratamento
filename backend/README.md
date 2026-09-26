# Meu Tratamento — Backend (Vercel)

Este é um projeto **separado** do app Expo, feito para ser implantado na
Vercel. Ele existe unicamente para manter a `GEMINI_API_KEY` e a
`SUPABASE_SERVICE_ROLE_KEY` fora do aplicativo mobile (ver seção 14 / Regra 3
do projeto).

## O que tem aqui

- `api/assistant.ts` — recebe a pergunta do usuário autenticado, busca os dados
  dele no Supabase (com a service role, mas sempre filtrando pelo `user_id`
  do token validado) e chama a Gemini API com um prompt que proíbe
  diagnóstico, prescrição ou alteração de dose.
- `api/delete-account.ts` — exclui a conta do usuário autenticado (e, por
  cascata no banco, todos os seus dados). Só existe aqui porque excluir um
  usuário do Supabase Auth exige a service role.

## Como implantar

1. Crie um novo projeto na Vercel apontando para a pasta `backend/` deste
   repositório (ou copie esta pasta para um repositório próprio).
2. Em **Project Settings → Environment Variables**, adicione:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
3. Faça o deploy. A URL final será algo como
   `https://seu-projeto.vercel.app/api/assistant`.
4. No app Expo, defina `EXPO_PUBLIC_AI_BACKEND_URL` e `EXPO_PUBLIC_DELETE_ACCOUNT_URL`
   (no `.env` do app) com as URLs correspondentes.

## Testando localmente

```bash
cd backend
npm install
npx vercel dev
```

Isso sobe a função em `http://localhost:3000/api/assistant`. Para testar,
envie um `POST` com um token de acesso válido do Supabase (copiado da sessão
do app) no header `Authorization: Bearer <token>` e `{ "question": "..." }`
no corpo.

## Segurança

- O token de acesso é sempre validado contra o Supabase Auth — o backend
  nunca confia em um `userId` vindo do corpo da requisição.
- A service role só é usada para ler os dados do usuário já autenticado,
  nunca para operações amplas na base.
- Nenhuma chave secreta deste diretório deve ir para o repositório do app
  mobile nem para o bundle do Expo.
