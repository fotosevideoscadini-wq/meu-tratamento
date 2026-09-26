import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { readCollection, writeCollection, generateLocalId } from "@/services/localStore";
import type { Appointment } from "@/types/database";

const KEY = "appointments";

export type AppointmentInput = Omit<Appointment, "id" | "user_id" | "created_at" | "updated_at">;

function nowIso() {
  return new Date().toISOString();
}

export async function listAppointments(userId: string): Promise<Appointment[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("appointment_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Appointment[];
  }
  const all = await readCollection<Appointment>(KEY);
  return all
    .filter((a) => a.user_id === userId)
    .sort((a, b) => (a.appointment_date + (a.appointment_time ?? "")).localeCompare(b.appointment_date + (b.appointment_time ?? "")));
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("appointments").select("*").eq("id", id).single();
    if (error) return null;
    return data as Appointment;
  }
  const all = await readCollection<Appointment>(KEY);
  return all.find((a) => a.id === id) ?? null;
}

export async function createAppointment(userId: string, input: AppointmentInput): Promise<Appointment> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Appointment;
  }
  const all = await readCollection<Appointment>(KEY);
  const created: Appointment = {
    id: generateLocalId(),
    user_id: userId,
    created_at: nowIso(),
    updated_at: nowIso(),
    ...input,
  };
  await writeCollection(KEY, [created, ...all]);
  return created;
}

export async function updateAppointment(id: string, input: Partial<AppointmentInput>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("appointments").update({ ...input, updated_at: nowIso() }).eq("id", id);
    if (error) throw error;
    return;
  }
  const all = await readCollection<Appointment>(KEY);
  await writeCollection(
    KEY,
    all.map((a) => (a.id === id ? { ...a, ...input, updated_at: nowIso() } : a))
  );
}

export async function deleteAppointment(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const all = await readCollection<Appointment>(KEY);
  await writeCollection(KEY, all.filter((a) => a.id !== id));
}

/** Próxima consulta a partir de agora (usada na Home). */
export async function getNextAppointment(userId: string): Promise<Appointment | null> {
  const all = await listAppointments(userId);
  const todayIso = nowIso().slice(0, 10);
  const nowTime = nowIso().slice(11, 16);
  const upcoming = all.filter(
    (a) => a.appointment_date > todayIso || (a.appointment_date === todayIso && (a.appointment_time ?? "23:59") >= nowTime)
  );
  return upcoming[0] ?? null;
}
