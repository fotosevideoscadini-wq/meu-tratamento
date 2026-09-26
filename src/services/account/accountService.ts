import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { readCollection, writeCollection } from "@/services/localStore";

const DELETE_ACCOUNT_ENDPOINT = process.env.EXPO_PUBLIC_DELETE_ACCOUNT_URL ?? "";

/**
 * Exclui a conta e TODOS os dados do usuário.
 *
 * - Com Supabase configurado: chama o backend (service role), que
 *   apaga o usuário no Auth; todas as tabelas caem em cascata
 *   (ON DELETE CASCADE definido nas migrations).
 * - Em modo mock: apaga apenas as linhas desse usuário em cada
 *   coleção local (AsyncStorage), sem depender de backend nenhum.
 */
export async function deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    if (!DELETE_ACCOUNT_ENDPOINT) {
      return { success: false, error: "EXPO_PUBLIC_DELETE_ACCOUNT_URL não configurado. Veja backend/README.md." };
    }
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) return { success: false, error: "Sessão inválida." };

    const response = await fetch(DELETE_ACCOUNT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { success: false, error: body.error ?? "Não foi possível excluir a conta." };
    }
    await supabase.auth.signOut();
    return { success: true };
  }

  // Modo mock: apaga localmente os registros deste usuário em cada coleção,
  // tratando as chaves estrangeiras específicas de cada tabela.
  for (const key of ["medications", "medication_schedules", "doses", "appointments", "measurements"]) {
    const all = await readCollection<{ user_id?: string }>(key);
    await writeCollection(key, all.filter((item) => item.user_id !== userId));
  }

  const links = await readCollection<{ id: string; owner_user_id: string; caregiver_user_id: string | null }>(
    "caregiver_links"
  );
  const removedLinkIds = new Set(
    links.filter((l) => l.owner_user_id === userId || l.caregiver_user_id === userId).map((l) => l.id)
  );
  await writeCollection(
    "caregiver_links",
    links.filter((l) => l.owner_user_id !== userId && l.caregiver_user_id !== userId)
  );

  const permissions = await readCollection<{ caregiver_link_id: string }>("caregiver_permissions");
  await writeCollection(
    "caregiver_permissions",
    permissions.filter((p) => !removedLinkIds.has(p.caregiver_link_id))
  );

  const profiles = await readCollection<{ id: string }>("profiles");
  await writeCollection("profiles", profiles.filter((p) => p.id !== userId));

  return { success: true };
}
