-- =========================================================
-- MEU TRATAMENTO — Migration 0005: família/cuidadores, configurações
-- =========================================================
-- Seção 13 / Regra: um cuidador NÃO recebe automaticamente
-- acesso ao histórico médico completo. Permissões são granulares
-- e explícitas, uma linha por tipo de dado autorizado.

create table if not exists caregiver_links (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade, -- quem é acompanhado
  caregiver_user_id uuid references auth.users (id) on delete cascade,      -- quem acompanha (após aceitar convite)
  caregiver_email text not null, -- usado para o convite antes do cadastro
  status caregiver_status not null default 'pending',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (owner_user_id, caregiver_email)
);

create index if not exists idx_caregiver_links_owner on caregiver_links (owner_user_id);
create index if not exists idx_caregiver_links_caregiver on caregiver_links (caregiver_user_id);

-- Permissões granulares por vínculo. Cada linha = um tipo de dado liberado.
-- Exemplo de permission_key: 'dose_missed_alert', 'stock_alert', 'full_history', 'appointments'
create table if not exists caregiver_permissions (
  id uuid primary key default gen_random_uuid(),
  caregiver_link_id uuid not null references caregiver_links (id) on delete cascade,
  permission_key text not null,
  enabled boolean not null default false,
  unique (caregiver_link_id, permission_key)
);

-- Configurações gerais do usuário (fora do que já está em profiles)
create table if not exists user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notifications_enabled boolean not null default true,
  stock_alert_default_threshold numeric not null default 10,
  language text not null default 'pt-BR',
  updated_at timestamptz not null default now()
);

create trigger trg_user_settings_updated_at
before update on user_settings
for each row execute function set_updated_at();
