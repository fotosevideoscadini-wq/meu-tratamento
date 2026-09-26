import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { readCollection, writeCollection, generateLocalId } from "@/services/localStore";
import type { CaregiverLink, CaregiverPermission } from "@/types/database";

const LINKS_KEY = "caregiver_links";
const PERMISSIONS_KEY = "caregiver_permissions";

/**
 * Chaves de permissão granulares (seção 13). NENHUMA delas é
 * habilitada automaticamente ao aceitar um convite — o titular
 * (owner) decide explicitamente o que compartilhar, e
 * "full_history" (histórico completo) é a mais sensível, por isso
 * fica sempre desligada por padrão na UI.
 */
export const PERMISSION_DEFINITIONS: { key: string; label: string; sensitive?: boolean }[] = [
  { key: "dose_missed_alert", label: "Avisar quando uma dose não for confirmada" },
  { key: "stock_alert", label: "Avisar quando o estoque estiver acabando" },
  { key: "appointments", label: "Ver consultas agendadas" },
  { key: "full_history", label: "Ver histórico completo de doses", sensitive: true },
];

function nowIso() {
  return new Date().toISOString();
}

// ---------- VÍNCULOS ----------

/** Pessoas que EU convidei para acompanhar meu tratamento. */
export async function listMyCaregivers(ownerUserId: string): Promise<CaregiverLink[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("caregiver_links")
      .select("*")
      .eq("owner_user_id", ownerUserId)
      .order("invited_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CaregiverLink[];
  }
  const all = await readCollection<CaregiverLink>(LINKS_KEY);
  return all.filter((l) => l.owner_user_id === ownerUserId);
}

/** Pessoas para quem EU sou cuidador (convites que já aceitei). */
export async function listWhereIAmCaregiver(caregiverUserId: string): Promise<CaregiverLink[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("caregiver_links")
      .select("*")
      .eq("caregiver_user_id", caregiverUserId)
      .eq("status", "active");
    if (error) throw error;
    return (data ?? []) as CaregiverLink[];
  }
  const all = await readCollection<CaregiverLink>(LINKS_KEY);
  return all.filter((l) => l.caregiver_user_id === caregiverUserId && l.status === "active");
}

/** Convites pendentes endereçados ao meu e-mail (para eu aceitar). */
export async function listPendingInvitesForEmail(email: string): Promise<CaregiverLink[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("caregiver_links")
      .select("*")
      .eq("caregiver_email", email)
      .eq("status", "pending");
    if (error) throw error;
    return (data ?? []) as CaregiverLink[];
  }
  const all = await readCollection<CaregiverLink>(LINKS_KEY);
  return all.filter((l) => l.caregiver_email === email && l.status === "pending");
}

export async function inviteCaregiver(ownerUserId: string, email: string): Promise<CaregiverLink> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("caregiver_links")
      .insert({ owner_user_id: ownerUserId, caregiver_email: email.trim().toLowerCase(), status: "pending" })
      .select()
      .single();
    if (error) throw error;
    return data as CaregiverLink;
  }
  const all = await readCollection<CaregiverLink>(LINKS_KEY);
  const created: CaregiverLink = {
    id: generateLocalId(),
    owner_user_id: ownerUserId,
    caregiver_user_id: null,
    caregiver_email: email.trim().toLowerCase(),
    status: "pending",
    invited_at: nowIso(),
    accepted_at: null,
  };
  await writeCollection(LINKS_KEY, [created, ...all]);
  return created;
}

export async function acceptInvite(linkId: string, caregiverUserId: string): Promise<void> {
  const patch = { status: "active" as const, caregiver_user_id: caregiverUserId, accepted_at: nowIso() };
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("caregiver_links").update(patch).eq("id", linkId);
    if (error) throw error;
    return;
  }
  const all = await readCollection<CaregiverLink>(LINKS_KEY);
  await writeCollection(LINKS_KEY, all.map((l) => (l.id === linkId ? { ...l, ...patch } : l)));
}

export async function revokeCaregiverLink(linkId: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("caregiver_links").update({ status: "revoked" }).eq("id", linkId);
    if (error) throw error;
    return;
  }
  const all = await readCollection<CaregiverLink>(LINKS_KEY);
  await writeCollection(LINKS_KEY, all.map((l) => (l.id === linkId ? { ...l, status: "revoked" } : l)));
}

// ---------- PERMISSÕES ----------

export async function listPermissions(linkId: string): Promise<CaregiverPermission[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("caregiver_permissions").select("*").eq("caregiver_link_id", linkId);
    if (error) throw error;
    return (data ?? []) as CaregiverPermission[];
  }
  const all = await readCollection<CaregiverPermission>(PERMISSIONS_KEY);
  return all.filter((p) => p.caregiver_link_id === linkId);
}

export async function setPermission(linkId: string, key: string, enabled: boolean): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("caregiver_permissions")
      .upsert({ caregiver_link_id: linkId, permission_key: key, enabled }, { onConflict: "caregiver_link_id,permission_key" });
    if (error) throw error;
    return;
  }
  const all = await readCollection<CaregiverPermission>(PERMISSIONS_KEY);
  const existing = all.find((p) => p.caregiver_link_id === linkId && p.permission_key === key);
  if (existing) {
    await writeCollection(
      PERMISSIONS_KEY,
      all.map((p) => (p.id === existing.id ? { ...p, enabled } : p))
    );
  } else {
    const created: CaregiverPermission = { id: generateLocalId(), caregiver_link_id: linkId, permission_key: key, enabled };
    await writeCollection(PERMISSIONS_KEY, [...all, created]);
  }
}
