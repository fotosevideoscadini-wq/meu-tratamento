import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { readCollection, writeCollection, generateLocalId } from "@/services/localStore";
import { listMedications, listSchedules, updateMedication } from "@/services/medications/medicationsService";
import type { Dose, DoseStatus, Medication } from "@/types/database";

const DOSES_KEY = "doses";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Garante que existam doses geradas para a data informada, a partir
 * dos horários (`medication_schedules`) de cada medicamento ATIVO do
 * usuário. Idempotente: não duplica doses já existentes para o mesmo
 * medicamento/horário/dia.
 *
 * Cobre por enquanto as frequências mais comuns (once/twice/three
 * times ao dia — todas representadas por linhas em `medication_schedules`).
 * `every_x_hours` e `specific_weekdays` usam `frequency_config` e serão
 * refinadas conforme o uso real (a estrutura já suporta ambas).
 */
export async function ensureDosesForDate(userId: string, date: string = todayIsoDate()): Promise<Dose[]> {
  const medications = await listMedications(userId);
  const activeMeds = medications.filter((m) => m.status === "active");

  const existing = await listDosesForDate(userId, date);
  const existingKey = (medId: string, time: string) => `${medId}__${time}`;
  const existingSet = new Set(existing.map((d) => existingKey(d.medication_id, d.scheduled_time)));

  const toCreate: Omit<Dose, "id">[] = [];

  for (const med of activeMeds) {
    if (med.start_date > date) continue;
    if (med.end_date && med.end_date < date) continue;

    if (med.frequency === "specific_weekdays") {
      const weekdays: number[] = (med.frequency_config?.weekdays as number[]) ?? [];
      const dow = new Date(date + "T00:00:00").getDay();
      if (!weekdays.includes(dow)) continue;
    }

    const schedules = await listSchedules(med.id);
    for (const sched of schedules) {
      if (existingSet.has(existingKey(med.id, sched.time_of_day))) continue;
      const isPastDate = date < todayIsoDate();
      toCreate.push({
        user_id: userId,
        medication_id: med.id,
        schedule_id: sched.id,
        scheduled_date: date,
        scheduled_time: sched.time_of_day,
        confirmed_at: null,
        status: isPastDate ? "unconfirmed" : "pending",
        snoozed_to: null,
        created_at: new Date().toISOString(),
      });
    }
  }

  if (toCreate.length === 0) return existing;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("doses").insert(toCreate).select();
    if (error) throw error;
    return [...existing, ...((data ?? []) as Dose[])];
  }

  const all = await readCollection<Dose>(DOSES_KEY);
  const created = toCreate.map((d) => ({ ...d, id: generateLocalId() }));
  await writeCollection(DOSES_KEY, [...all, ...created]);
  return [...existing, ...created];
}

export async function listDosesForDate(userId: string, date: string): Promise<Dose[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("doses")
      .select("*")
      .eq("user_id", userId)
      .eq("scheduled_date", date)
      .order("scheduled_time", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Dose[];
  }
  const all = await readCollection<Dose>(DOSES_KEY);
  return all
    .filter((d) => d.user_id === userId && d.scheduled_date === date)
    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
}

export async function listDosesInRange(userId: string, startDate: string, endDate: string): Promise<Dose[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("doses")
      .select("*")
      .eq("user_id", userId)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Dose[];
  }
  const all = await readCollection<Dose>(DOSES_KEY);
  return all.filter((d) => d.user_id === userId && d.scheduled_date >= startDate && d.scheduled_date <= endDate);
}

function eachDateBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

/**
 * Garante doses geradas para TODOS os dias de um intervalo (usado
 * pelo Calendário — Fase 5 — para exibir o mês inteiro, não só hoje).
 * Faz uma chamada por dia; para o volume de um mês isso é aceitável
 * nesta fase. Uma função de banco (RPC) poderá otimizar isso depois.
 */
export async function ensureDosesForDateRange(userId: string, startDate: string, endDate: string): Promise<Dose[]> {
  const dates = eachDateBetween(startDate, endDate);
  const results: Dose[] = [];
  for (const date of dates) {
    const doses = await ensureDosesForDate(userId, date);
    results.push(...doses);
  }
  return results;
}

async function updateDose(id: string, patch: Partial<Dose>): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("doses").update(patch).eq("id", id);
    if (error) throw error;
    return;
  }
  const all = await readCollection<Dose>(DOSES_KEY);
  await writeCollection(
    DOSES_KEY,
    all.map((d) => (d.id === id ? { ...d, ...patch } : d))
  );
}

/** Marca a dose como tomada e desconta 1x a quantidade do estoque do medicamento. */
export async function markDoseTaken(dose: Dose, medication: Medication | null): Promise<void> {
  await updateDose(dose.id, { status: "taken" as DoseStatus, confirmed_at: new Date().toISOString() });

  if (medication && medication.stock_quantity != null) {
    const consumed = medication.dose_amount ?? 1;
    const nextStock = Math.max(0, medication.stock_quantity - consumed);
    await updateMedication(medication.id, { stock_quantity: nextStock });
  }
}

export async function markDoseSkipped(dose: Dose): Promise<void> {
  await updateDose(dose.id, { status: "skipped" as DoseStatus, confirmed_at: new Date().toISOString() });
}

/** Adia a dose para daqui a X minutos (ou para um horário customizado). */
export async function snoozeDose(dose: Dose, minutesFromNow?: number, customIsoTime?: string): Promise<void> {
  const snoozedTo = customIsoTime ?? new Date(Date.now() + (minutesFromNow ?? 15) * 60_000).toISOString();
  await updateDose(dose.id, { status: "snoozed" as DoseStatus, snoozed_to: snoozedTo });
}
