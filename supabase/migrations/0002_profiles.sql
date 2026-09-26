-- =========================================================
-- MEU TRATAMENTO — Migration 0002: profiles
-- =========================================================
-- Regra de privacidade (seção 15): dados DA CONTA ficam aqui,
-- separados dos dados DO TRATAMENTO (medicamentos, doses etc,
-- que vêm nas próximas migrations). Nada de dado médico aqui.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  greeting_name text, -- nome curto usado nas saudações ("Bom dia, Carlos!")
  avatar_url text,
  theme_preference text not null default 'system' check (theme_preference in ('light', 'dark', 'system')),
  plan plan_type not null default 'free',
  ai_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Dados da conta do usuário. Não contém dados de saúde/tratamento.';

-- Mantém updated_at em dia automaticamente
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

-- Cria automaticamente um profile ao registrar um novo usuário no Auth
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, greeting_name)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'greeting_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
