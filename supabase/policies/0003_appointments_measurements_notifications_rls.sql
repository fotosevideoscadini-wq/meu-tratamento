-- =========================================================
-- MEU TRATAMENTO — RLS 0003: consultas, medições, notificações
-- =========================================================

alter table appointments enable row level security;
alter table measurements enable row level security;
alter table notifications enable row level security;

create policy "appointments_select_own"
  on appointments for select using (auth.uid() = user_id);
create policy "appointments_insert_own"
  on appointments for insert with check (auth.uid() = user_id);
create policy "appointments_update_own"
  on appointments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "appointments_delete_own"
  on appointments for delete using (auth.uid() = user_id);

create policy "measurements_select_own"
  on measurements for select using (auth.uid() = user_id);
create policy "measurements_insert_own"
  on measurements for insert with check (auth.uid() = user_id);
create policy "measurements_update_own"
  on measurements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "measurements_delete_own"
  on measurements for delete using (auth.uid() = user_id);

create policy "notifications_select_own"
  on notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own"
  on notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete_own"
  on notifications for delete using (auth.uid() = user_id);
-- Inserção de notificações é feita pelo backend (service role),
-- por isso não há policy de insert para o usuário comum aqui.
