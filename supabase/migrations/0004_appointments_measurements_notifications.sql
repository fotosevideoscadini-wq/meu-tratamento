-- =========================================================
-- MEU TRATAMENTO — Migration 0004: consultas, medições, notificações
-- =========================================================

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  professional_name text not null,
  specialty text,
  appointment_date date not null,
  appointment_time time,
  location text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_appointments_updated_at
before update on appointments
for each row execute function set_updated_at();

create index if not exists idx_appointments_user_date on appointments (user_id, appointment_date);

-- Medições de saúde — SOMENTE registros informados pelo usuário.
-- O app não interpreta, não diagnostica, não recomenda dose (ver regra 4/seção 11).
create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type measurement_type not null,
  value_primary numeric not null, -- ex: sistólica, glicemia, peso, temperatura...
  value_secondary numeric, -- ex: diastólica (pressão arterial)
  unit text, -- mmHg, mg/dL, kg, °C, bpm, %...
  label text, -- usado quando type = 'custom'
  measured_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_measurements_user_date on measurements (user_id, measured_at);

-- Notificações internas do app (ex: "estoque acabando", "cuidador: dose não confirmada")
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  category text not null default 'general', -- 'stock' | 'dose' | 'appointment' | 'caregiver' | 'general'
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications (user_id, created_at desc);
