import { listDosesInRange } from "@/services/doses/dosesService";
import { listMedications } from "@/services/medications/medicationsService";
import { listMeasurements } from "@/services/measurements/measurementsService";
import { listAppointments } from "@/services/appointments/appointmentsService";

export type ReportSummary = {
  totalScheduled: number;
  taken: number;
  pending: number;
  snoozed: number;
  skipped: number;
  unconfirmed: number;
  adherencePercent: number; // taken / totalScheduled, arredondado
  activeMedicationsCount: number;
  measurementsCount: number;
  appointmentsCount: number;
};

export async function buildReport(userId: string, startDate: string, endDate: string): Promise<ReportSummary> {
  const [doses, medications, measurements, appointments] = await Promise.all([
    listDosesInRange(userId, startDate, endDate),
    listMedications(userId),
    listMeasurements(userId, 500),
    listAppointments(userId),
  ]);

  const taken = doses.filter((d) => d.status === "taken").length;
  const pending = doses.filter((d) => d.status === "pending").length;
  const snoozed = doses.filter((d) => d.status === "snoozed").length;
  const skipped = doses.filter((d) => d.status === "skipped").length;
  const unconfirmed = doses.filter((d) => d.status === "unconfirmed").length;
  const totalScheduled = doses.length;

  const measurementsCount = measurements.filter(
    (m) => m.measured_at.slice(0, 10) >= startDate && m.measured_at.slice(0, 10) <= endDate
  ).length;

  const appointmentsCount = appointments.filter(
    (a) => a.appointment_date >= startDate && a.appointment_date <= endDate
  ).length;

  return {
    totalScheduled,
    taken,
    pending,
    snoozed,
    skipped,
    unconfirmed,
    adherencePercent: totalScheduled > 0 ? Math.round((taken / totalScheduled) * 100) : 0,
    activeMedicationsCount: medications.filter((m) => m.status === "active").length,
    measurementsCount,
    appointmentsCount,
  };
}
