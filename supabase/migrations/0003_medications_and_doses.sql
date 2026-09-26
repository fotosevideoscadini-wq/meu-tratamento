-- =========================================================
-- MEU TRATAMENTO — Migration 0003: medicamentos, horários, doses
-- =========================================================

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  active_ingredient text,
  presentation text, -- comprimido, cápsula, xarope, injeção, etc.
  dose_amount numeric,
  dose_unit text, -- mg, ml, comprimido(s), etc.
  photo_url text,
  notes text,
  reason text, -- motivo/indicação (opcional, informado pelo usuário)
  frequency frequency_type not null default 'once_daily',
  frequency_config jsonb not null default '{}'::jsonb, -- ex: {"every_x_hours": 8} ou {"weekdays": [1,3,5]}
  start_date date not null default current_date,
  end_date date,
  status medication_status not null default 'active',
  stock_quantity numeric, -- estoque atual
  stock_alert_threshold numeric, -- "avise quando restarem X"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_medications_updated_at
before update on medications
for each row execute function set_updated_at();

create index if not exists idx_medications_user on medications (user_id);

-- Horários programados para cada medicamento (ex: 08:00, 20:00)
create table if not exists medication_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  time_of_day time not null,
  quantity_per_dose numeric not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_schedules_medication on medication_schedules (medication_id);
create index if not exists idx_schedules_user on medication_schedules (user_id);

-- Doses concretas geradas a partir dos horários (uma por dia/horário)
create table if not exists doses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references medications (id) on delete cascade,
  schedule_id uuid references medication_schedules (id) on delete set null,
  scheduled_date date not null,
  scheduled_time time not null,
  confirmed_at timestamptz,
  status dose_status not null default 'pending',
  snoozed_to timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_doses_user_date on doses (user_id, scheduled_date);
create index if not exists idx_doses_medication on doses (medication_id);

comment on table doses is 'Uma linha por dose esperada. Ações Tomei/Adiar/Pular atualizam status/confirmed_at aqui, formando o histórico.';
