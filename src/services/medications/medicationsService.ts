import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { readCollection, writeCollection, generateLocalId } from "@/services/localStore";
import type { Medication, MedicationSchedule, MedicationStatus } from "@/types/database";

const MEDICATIONS_KEY = "medications";
const SCHEDULES_KEY = "medication_schedules";

export type MedicationInput = Omit<
  Medication,
  "id" | "user_id" | "created_at" | "updated_at" | "status"
> & { status?: MedicationStatus };

export type ScheduleInput = { time_of_day: string; quantity_per_dose: number };

function nowIso() {
  return new Date().toISOString();
}

// ---------- MEDICAMENTOS ----------

export async function listMedications(userId: string): Promise<Medication[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Medication[];
  }
  const all = await readCollection<Medication>(MEDICATIONS_KEY);
  return all.filter((m) => m.user_id === userId);
}

export async function getMedication(id: string): Promise<Medication | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("medications").select("*").eq("id", id).single();
    if (error) return null;
    return data as Medication;
  }
  const all = await readCollection<Medication>(MEDICATIONS_KEY);
  return all.find((m) => m.id === id) ?? null;
}

export async function createMedication(userId: string, input: MedicationInput): Promise<Medication> {
  const base: Medication = {
    id: "",
    user_id: userId,
    status: input.status ?? "active",
    created_at: nowIso(),
    updated_at: nowIso(),
    ...input,
  } as Medication;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("medications")
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Medication;
  }

  const all = await readCollection<Medication>(MEDICATIONS_KEY);
  const created = { ...base, id: generateLocalId() };
  await writeCollection(MEDICATIONS_KEY, [created, ...all]);
  return created;
}

export async function updateMedication(id: string, input: Partial<MedicationInput>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("medications")
      .update({ ...input, updated_at: nowIso() })
      .eq("id", id);
    if (error) throw error;
    return;
  }
  const all = await readCollection<Medication>(MEDICATIONS_KEY);
  const next = all.map((m) => (m.id === id ? { ...m, ...input, updated_at: nowIso() } : m));
  await writeCollection(MEDICATIONS_KEY, next);
}

export async function setMedicationStatus(id: string, status: MedicationStatus): Promise<void> {
  await updateMedication(id, { status });
}

export async function deleteMedication(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const all = await readCollection<Medication>(MEDICATIONS_KEY);
  await writeCollection(MEDICATIONS_KEY, all.filter((m) => m.id !== id));

  const schedules = await readCollection<MedicationSchedule>(SCHEDULES_KEY);
  await writeCollection(
    SCHEDULES_KEY,
    schedules.filter((s) => s.medication_id !== id)
  );
}

// ---------- HORÁRIOS ----------

export async function listSchedules(medicationId: string): Promise<MedicationSchedule[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("medication_schedules")
      .select("*")
      .eq("medication_id", medicationId)
      .order("time_of_day", { ascending: true });
    if (error) throw error;
    return (data ?? []) as MedicationSchedule[];
  }
  const all = await readCollection<MedicationSchedule>(SCHEDULES_KEY);
  return all
    .filter((s) => s.medication_id === medicationId)
    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));
}

export async function replaceSchedules(
  userId: string,
  medicationId: string,
  schedules: ScheduleInput[]
): Promise<MedicationSchedule[]> {
  if (isSupabaseConfigured) {
    await supabase.from("medication_schedules").delete().eq("medication_id", medicationId);
    if (schedules.length === 0) return [];
    const { data, error } = await supabase
      .from("medication_schedules")
      .insert(schedules.map((s) => ({ ...s, medication_id: medicationId, user_id: userId })))
      .select();
    if (error) throw error;
    return (data ?? []) as MedicationSchedule[];
  }

  const all = await readCollection<MedicationSchedule>(SCHEDULES_KEY);
  const withoutThisMed = all.filter((s) => s.medication_id !== medicationId);
  const created: MedicationSchedule[] = schedules.map((s) => ({
    id: generateLocalId(),
    medication_id: medicationId,
    user_id: userId,
    time_of_day: s.time_of_day,
    quantity_per_dose: s.quantity_per_dose,
    created_at: nowIso(),
  }));
  await writeCollection(SCHEDULES_KEY, [...withoutThisMed, ...created]);
  return created;
}
