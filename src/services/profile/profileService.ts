import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { readCollection, writeCollection } from "@/services/localStore";
import type { PlanType, Profile } from "@/types/database";

const KEY = "profiles";

function defaultProfile(userId: string): Profile {
  return {
    id: userId,
    full_name: null,
    greeting_name: null,
    avatar_url: null,
    theme_preference: "system",
    plan: "free",
    ai_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error || !data) return defaultProfile(userId);
    return data as Profile;
  }
  const all = await readCollection<Profile>(KEY);
  return all.find((p) => p.id === userId) ?? defaultProfile(userId);
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  }
  const all = await readCollection<Profile>(KEY);
  const existing = all.find((p) => p.id === userId) ?? defaultProfile(userId);
  const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
  const next = all.some((p) => p.id === userId) ? all.map((p) => (p.id === userId ? updated : p)) : [...all, updated];
  await writeCollection(KEY, next);
  return updated;
}

export async function setPlan(userId: string, plan: PlanType): Promise<void> {
  await updateProfile(userId, { plan });
}

export async function setAiEnabled(userId: string, enabled: boolean): Promise<void> {
  await updateProfile(userId, { ai_enabled: enabled });
}
