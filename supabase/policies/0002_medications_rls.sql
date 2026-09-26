-- =========================================================
-- MEU TRATAMENTO — RLS 0002: medicamentos, horários, doses
-- =========================================================

alter table medications enable row level security;
alter table medication_schedules enable row level security;
alter table doses enable row level security;

-- MEDICATIONS: CRUD completo, sempre restrito a user_id = auth.uid()
create policy "medications_select_own"
  on medications for select using (auth.uid() = user_id);
create policy "medications_insert_own"
  on medications for insert with check (auth.uid() = user_id);
create policy "medications_update_own"
  on medications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "medications_delete_own"
  on medications for delete using (auth.uid() = user_id);

-- MEDICATION_SCHEDULES
create policy "schedules_select_own"
  on medication_schedules for select using (auth.uid() = user_id);
create policy "schedules_insert_own"
  on medication_schedules for insert with check (auth.uid() = user_id);
create policy "schedules_update_own"
  on medication_schedules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "schedules_delete_own"
  on medication_schedules for delete using (auth.uid() = user_id);

-- DOSES
create policy "doses_select_own"
  on doses for select using (auth.uid() = user_id);
create policy "doses_insert_own"
  on doses for insert with check (auth.uid() = user_id);
create policy "doses_update_own"
  on doses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "doses_delete_own"
  on doses for delete using (auth.uid() = user_id);
