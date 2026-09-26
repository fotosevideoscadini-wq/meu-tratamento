-- =========================================================
-- MEU TRATAMENTO — RLS 0005: acesso de cuidador aos dados
-- de tratamento (medicamentos, doses, consultas) — FASE 7
-- =========================================================
-- Regra central (seção 13): nenhum acesso é automático. Um
-- cuidador só enxerga dados de um titular quando:
--   1. existe um caregiver_links com status = 'active' entre eles, E
--   2. existe uma caregiver_permissions.enabled = true para a
--      permissão correspondente.
--
-- Simplificação assumida nesta fase: a permissão libera a LINHA
-- inteira da tabela (não campo a campo). Ex.: 'full_history'
-- libera todas as doses; 'dose_missed_alert' também libera leitura
-- de doses (para o cuidador saber que uma dose não foi confirmada),
-- mas é conceitualmente diferente de 'full_history' — a distinção
-- fina entre "só doses não confirmadas" e "histórico completo"
-- pode ser refinada depois com uma view/RPC dedicada, se necessário.

-- MEDICATIONS — necessário para o cuidador saber o NOME do
-- medicamento numa dose/alerta, e para o alerta de estoque.
create policy "medications_select_caregiver"
  on medications for select
  using (
    exists (
      select 1 from caregiver_links cl
      join caregiver_permissions cp on cp.caregiver_link_id = cl.id
      where cl.owner_user_id = medications.user_id
        and cl.caregiver_user_id = auth.uid()
        and cl.status = 'active'
        and cp.enabled = true
        and cp.permission_key in ('dose_missed_alert', 'stock_alert', 'full_history')
    )
  );

-- DOSES — leitura para alerta de dose não confirmada ou histórico completo.
create policy "doses_select_caregiver"
  on doses for select
  using (
    exists (
      select 1 from caregiver_links cl
      join caregiver_permissions cp on cp.caregiver_link_id = cl.id
      where cl.owner_user_id = doses.user_id
        and cl.caregiver_user_id = auth.uid()
        and cl.status = 'active'
        and cp.enabled = true
        and cp.permission_key in ('dose_missed_alert', 'full_history')
    )
  );

-- APPOINTMENTS — leitura apenas com a permissão específica de consultas.
create policy "appointments_select_caregiver"
  on appointments for select
  using (
    exists (
      select 1 from caregiver_links cl
      join caregiver_permissions cp on cp.caregiver_link_id = cl.id
      where cl.owner_user_id = appointments.user_id
        and cl.caregiver_user_id = auth.uid()
        and cl.status = 'active'
        and cp.enabled = true
        and cp.permission_key = 'appointments'
    )
  );

-- Nenhuma policy de INSERT/UPDATE/DELETE é criada para cuidadores:
-- o acesso concedido aqui é sempre SOMENTE LEITURA. Medições de
-- saúde e dados de conta (profiles) NÃO são liberados a cuidadores
-- nesta fase — não há policy de select para eles em nenhuma
-- permissão, mantendo o princípio de menor acesso possível.
