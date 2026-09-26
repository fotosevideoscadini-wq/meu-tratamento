# Configurando o banco de dados no Supabase — FASE 2

## Ordem de execução

No **Supabase Dashboard → SQL Editor**, execute os arquivos **nesta ordem exata**, um de cada vez:

### 1. Migrations (criam tabelas, enums e triggers)
1. `migrations/0001_extensions_and_enums.sql`
2. `migrations/0002_profiles.sql`
3. `migrations/0003_medications_and_doses.sql`
4. `migrations/0004_appointments_measurements_notifications.sql`
5. `migrations/0005_caregivers_and_settings.sql`

### 2. Policies (ativam e configuram o RLS — Row Level Security)
6. `policies/0001_profiles_rls.sql`
7. `policies/0002_medications_rls.sql`
8. `policies/0003_appointments_measurements_notifications_rls.sql`
9. `policies/0004_caregivers_settings_rls.sql`
10. `policies/0005_caregiver_data_access_rls.sql` *(Fase 7 — acesso condicional do cuidador)*

> ⚠️ **Não pule as policies.** Sem elas, as tabelas ficam com RLS desligado ou sem regras — na prática, ninguém consegue ler nada (comportamento padrão seguro do Supabase quando RLS está ativo sem policies) até você rodar esses arquivos.

## Como confirmar que o RLS está correto

Depois de rodar tudo, no Supabase vá em **Authentication → Policies** (ou **Table Editor → [tabela] → RLS**) e confirme que cada tabela abaixo aparece com **RLS enabled** e as policies listadas:

- `profiles`, `medications`, `medication_schedules`, `doses`, `appointments`, `measurements`, `notifications`, `caregiver_links`, `caregiver_permissions`, `user_settings`.

## Teste manual recomendado (2 usuários fictícios)

1. Crie dois usuários de teste pelo app (ex: `teste1@example.com` e `teste2@example.com`), **nunca dados reais**.
2. Cadastre um medicamento fictício com o usuário 1.
3. Faça login com o usuário 2 e confirme que a lista de medicamentos aparece **vazia** — essa é a prova de que o isolamento por `auth.uid()` está funcionando.

## Testando o acesso de cuidador (Fase 7)

O acesso de cuidador só é observável de verdade com o Supabase configurado e **duas contas reais**:

1. Com a conta A (titular), na tela **Família e Cuidadores**, convide o e-mail da conta B.
2. Entre com a conta B — o convite pendente aparece; toque em **Aceitar**.
3. De volta à conta A, expanda o cuidador na lista e ligue, por exemplo, "Avisar quando uma dose não for confirmada".
4. A conta B passa a conseguir ler as doses da conta A (via `doses_select_caregiver`), mas **nenhuma outra tabela** — nem medições, nem perfil — a menos que a permissão correspondente também seja ligada.

Em modo mock (sem Supabase), o convite e o aceite funcionam apenas dentro do mesmo aparelho/conta — não há uma segunda conta real para validar o isolamento.

## O que esta fase NÃO cobre ainda

- Acesso de cuidador aos dados reais de tratamento do titular (medicamentos/doses) — as tabelas e permissões granulares já existem, mas as policies que *liberam* esse acesso condicional serão criadas na **Fase 7**, junto com a interface de convite.
- Geração automática de linhas em `doses` a partir de `medication_schedules` (isso é lógica de aplicação/backend, criada na **Fase 4**).
- Qualquer policy usando a `service_role key` (que ignora RLS) — essa chave só existe no backend, nunca aqui.
