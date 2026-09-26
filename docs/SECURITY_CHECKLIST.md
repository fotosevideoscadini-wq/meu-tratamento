# Checklist de Segurança — Meu Tratamento

Revisão final (Fase 10) do que foi implementado nas fases anteriores.

## Autenticação e sessão
- [x] Cadastro, login, logout, recuperação de senha (Fase 2), via Supabase Auth.
- [x] Sessão persistida com `AsyncStorage` e renovação automática de token (`autoRefreshToken`).
- [x] Exclusão de conta real, incluindo todos os dados (Fase 10) — `backend/api/delete-account.ts`.

## Banco de dados e RLS
- [x] Row Level Security ativado em **todas** as tabelas com dados de usuário.
- [x] Policies testadas: um usuário nunca lê/escreve dados de outro (ver `supabase/README.md`).
- [x] Acesso de cuidador é somente leitura, condicionado a permissões explícitas, nunca automático (Fase 7).
- [x] Dados de conta (`profiles`) separados de dados de tratamento, conforme seção 15.

## Segredos
- [x] Nenhuma chave secreta no código do app mobile — apenas variáveis `EXPO_PUBLIC_*` (públicas por natureza) no `.env` do app.
- [x] `SUPABASE_SERVICE_ROLE_KEY` e `GEMINI_API_KEY` existem SOMENTE no backend (`backend/`), nunca no bundle do Expo.
- [x] `.gitignore` cobre `.env`, `.env.local` e chaves de assinatura Android/iOS.

## IA
- [x] O app nunca chama a Gemini diretamente; sempre via backend autenticado por token.
- [x] Prompt do backend proíbe explicitamente diagnóstico, prescrição e alteração de dose.

## Dados sensíveis (saúde)
- [x] Medições de saúde são só registros do usuário — o app não interpreta, não diagnostica, não recomenda.
- [x] Nenhum dado real de saúde foi usado durante o desenvolvimento (mocks fictícios).

## Pendências conhecidas para antes de produção real com usuários finais
- [ ] Ativar confirmação de e-mail no Supabase Auth (Authentication → Settings) antes de abrir para o público.
- [ ] Revisar rate limiting do backend (`/api/assistant` e `/api/delete-account`) — hoje não há limite de requisições por usuário.
- [ ] Definir política de retenção de logs do backend (não logar conteúdo de perguntas dos usuários em produção).
- [ ] Restringir `Access-Control-Allow-Origin` do backend ao domínio real do app, em vez de `*`.
- [ ] Revisão jurídica dos textos de Termos de Uso e Política de Privacidade antes da publicação.
