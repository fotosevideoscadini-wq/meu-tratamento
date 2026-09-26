-- =========================================================
-- MEU TRATAMENTO — RLS 0004: cuidadores e configurações
-- =========================================================
-- Nesta fase (2), apenas o isolamento básico é criado: o dono
-- do vínculo (owner) e o cuidador convidado podem ver o próprio
-- vínculo. O uso das permissões para LIBERAR acesso aos dados de
-- tratamento (medications, doses, etc.) será implementado na
-- FASE 7, com policies adicionais e mais restritas — não damos
-- acesso amplo por padrão.

alter table caregiver_links enable row level security;
alter table caregiver_permissions enable row level security;
alter table user_settings enable row level security;

-- CAREGIVER_LINKS
create policy "caregiver_links_select_owner_or_caregiver"
  on caregiver_links for select
  using (auth.uid() = owner_user_id or auth.uid() = caregiver_user_id);

create policy "caregiver_links_insert_owner"
  on caregiver_links for insert
  with check (auth.uid() = owner_user_id);

create policy "caregiver_links_update_owner"
  on caregiver_links for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy "caregiver_links_delete_owner"
  on caregiver_links for delete
  using (auth.uid() = owner_user_id);

-- CAREGIVER_PERMISSIONS — só o owner do vínculo associado pode gerenciar
create policy "caregiver_permissions_select_owner"
  on caregiver_permissions for select
  using (
    exists (
      select 1 from caregiver_links cl
      where cl.id = caregiver_permissions.caregiver_link_id
        and (cl.owner_user_id = auth.uid() or cl.caregiver_user_id = auth.uid())
    )
  );

create policy "caregiver_permissions_manage_owner"
  on caregiver_permissions for all
  using (
    exists (
      select 1 from caregiver_links cl
      where cl.id = caregiver_permissions.caregiver_link_id
        and cl.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from caregiver_links cl
      where cl.id = caregiver_permissions.caregiver_link_id
        and cl.owner_user_id = auth.uid()
    )
  );

-- USER_SETTINGS
create policy "user_settings_select_own"
  on user_settings for select using (auth.uid() = user_id);
create policy "user_settings_upsert_own"
  on user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own"
  on user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
