import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { readCollection, writeCollection, generateLocalId } from "@/services/localStore";
import type { Measurement, MeasurementType } from "@/types/database";

const KEY = "measurements";

export type MeasurementInput = Omit<Measurement, "id" | "user_id" | "created_at">;

export const MEASUREMENT_TYPE_LABEL: Record<MeasurementType, string> = {
  blood_pressure: "Pressão arterial",
  glucose: "Glicemia",
  weight: "Peso",
  temperature: "Temperatura",
  heart_rate: "Frequência cardíaca",
  oxygen_saturation: "Saturação",
  custom: "Personalizado",
};

export const MEASUREMENT_DEFAULT_UNIT: Record<MeasurementType, string> = {
  blood_pressure: "mmHg",
  glucose: "mg/dL",
  weight: "kg",
  temperature: "°C",
  heart_rate: "bpm",
  oxygen_saturation: "%",
  custom: "",
};

export async function listMeasurements(userId: string, limit = 50): Promise<Measurement[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("measurements")
      .select("*")
      .eq("user_id", userId)
      .order("measured_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Measurement[];
  }
  const all = await readCollection<Measurement>(KEY);
  return all
    .filter((m) => m.user_id === userId)
    .sort((a, b) => (a.measured_at < b.measured_at ? 1 : -1))
    .slice(0, limit);
}

export async function createMeasurement(userId: string, input: MeasurementInput): Promise<Measurement> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("measurements")
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Measurement;
  }
  const all = await readCollection<Measurement>(KEY);
  const created: Measurement = {
    id: generateLocalId(),
    user_id: userId,
    created_at: new Date().toISOString(),
    ...input,
  };
  await writeCollection(KEY, [created, ...all]);
  return created;
}

export async function deleteMeasurement(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("measurements").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const all = await readCollection<Measurement>(KEY);
  await writeCollection(KEY, all.filter((m) => m.id !== id));
}
