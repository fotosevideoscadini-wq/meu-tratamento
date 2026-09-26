-- =========================================================
-- MEU TRATAMENTO — RLS 0001: profiles
-- =========================================================
-- Rode DEPOIS de todas as migrations. Cada tabela com dados
-- de usuário tem RLS ativado e políticas que restringem
-- leitura/escrita ao próprio dono (auth.uid()).

alter table profiles enable row level security;

create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Não há policy de INSERT/DELETE manual: o registro é criado
-- automaticamente pelo trigger handle_new_user() e removido em
-- cascata quando a conta é excluída (auth.users on delete cascade).
