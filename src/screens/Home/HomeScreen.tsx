import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NextDoseCard } from "@/components/home/NextDoseCard";
import { ShortcutsGrid } from "@/components/home/ShortcutsGrid";
import { SummaryCard } from "@/components/home/SummaryCard";
import { AIAssistantCard } from "@/components/home/AIAssistantCard";
import { NextAppointmentCard } from "@/components/home/NextAppointmentCard";
import { ensureDosesForDate, markDoseSkipped, markDoseTaken, snoozeDose } from "@/services/doses/dosesService";
import { listMedications } from "@/services/medications/medicationsService";
import { getNextAppointment } from "@/services/appointments/appointmentsService";
import { getProfile } from "@/services/profile/profileService";
import {
  addDoseActionListener,
  requestNotificationPermission,
  scheduleDoseReminder,
  setupNotificationCategories,
} from "@/services/notifications/notificationService";
import type { Dose, Medication } from "@/types/database";
import type { Appointment } from "@/types/database";
import type { MockDose } from "@/mocks/mockHomeData";

function formatToday(): string {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function toDisplayDose(dose: Dose, medication: Medication | undefined): MockDose {
  return {
    id: dose.id,
    medicationName: medication?.name ?? "Medicamento",
    doseLabel: `${medication?.dose_amount ?? ""} ${medication?.dose_unit ?? ""}`.trim(),
    time: dose.scheduled_time.slice(0, 5),
    status: dose.status === "unconfirmed" ? "pending" : dose.status,
  };
}

export function HomeScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [doses, setDoses] = useState<Dose[]>([]);
  const [medicationsById, setMedicationsById] = useState<Record<string, Medication>>({});
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [medications, todayDoses, appointment, profile] = await Promise.all([
      listMedications(user.id),
      ensureDosesForDate(user.id),
      getNextAppointment(user.id),
      getProfile(user.id),
    ]);
    const byId: Record<string, Medication> = {};
    medications.forEach((m) => (byId[m.id] = m));
    setMedicationsById(byId);
    setDoses(todayDoses);
    setNextAppointment(appointment);
    setAiEnabled(profile.ai_enabled);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Configura categorias de notificação e agenda lembretes para doses
  // pendentes de hoje ainda não passadas. Roda quando as doses mudam.
  useEffect(() => {
    (async () => {
      await setupNotificationCategories();
      const granted = await requestNotificationPermission();
      if (!granted) return;

      const now = new Date();
      for (const dose of doses) {
        if (dose.status !== "pending") continue;
        const med = medicationsById[dose.medication_id];
        const [h, m] = dose.scheduled_time.split(":").map(Number);
        const triggerDate = new Date();
        triggerDate.setHours(h, m, 0, 0);
        if (triggerDate.getTime() <= now.getTime()) continue; // não agenda horário já passado
        await scheduleDoseReminder({
          doseId: dose.id,
          medicationName: med?.name ?? "Medicamento",
          doseLabel: `${med?.dose_amount ?? ""} ${med?.dose_unit ?? ""}`.trim(),
          triggerDate,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doses.length]);

  // Ouve as ações tomadas diretamente na notificação (Tomei/Adiar/Pular)
  // e aplica a mesma lógica dos botões da tela.
  useEffect(() => {
    const sub = addDoseActionListener((doseId, action) => {
      if (action === "TAKEN") handleConfirmTaken(doseId);
      else if (action === "SNOOZE_15") handleSnooze(doseId, 15);
      else if (action === "SKIP") handleSkip(doseId);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doses, medicationsById]);

  const nextDose = useMemo(() => {
    const pending = doses.filter((d) => d.status === "pending").sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    const dose = pending[0];
    return dose ? toDisplayDose(dose, medicationsById[dose.medication_id]) : null;
  }, [doses, medicationsById]);

  const summary = useMemo(() => {
    const total = doses.length;
    const taken = doses.filter((d) => d.status === "taken").length;
    const pending = doses.filter((d) => d.status === "pending" || d.status === "snoozed").length;
    const skipped = doses.filter((d) => d.status === "skipped").length;
    return { total, taken, pending, skipped };
  }, [doses]);

  async function handleConfirmTaken(doseId: string) {
    const dose = doses.find((d) => d.id === doseId);
    if (!dose) return;
    await markDoseTaken(dose, medicationsById[dose.medication_id] ?? null);
    setDoses((prev) => prev.map((d) => (d.id === doseId ? { ...d, status: "taken" } : d)));
    loadData(); // recarrega para refletir baixa de estoque
  }

  async function handleSnooze(doseId: string, minutes: number) {
    const dose = doses.find((d) => d.id === doseId);
    if (!dose) return;
    await snoozeDose(dose, minutes);
    setDoses((prev) => prev.map((d) => (d.id === doseId ? { ...d, status: "snoozed" } : d)));
    const med = medicationsById[dose.medication_id];
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleDoseReminder({
        doseId: dose.id,
        medicationName: med?.name ?? "Medicamento",
        doseLabel: `${med?.dose_amount ?? ""} ${med?.dose_unit ?? ""}`.trim(),
        triggerDate: new Date(Date.now() + minutes * 60_000),
      });
    }
  }

  async function handleSkip(doseId: string) {
    const dose = doses.find((d) => d.id === doseId);
    if (!dose) return;
    await markDoseSkipped(dose);
    setDoses((prev) => prev.map((d) => (d.id === doseId ? { ...d, status: "skipped" } : d)));
  }

  const greetingName = user?.name ?? "";

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <HomeHeader onPressBell={() => {}} onPressAvatar={() => navigation.navigate("MoreTab", { screen: "Settings" })} />

      <Text style={[styles.greeting, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
        Bom dia{greetingName ? `, ${greetingName}` : ""}!
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg, textTransform: "capitalize" }}>
        Hoje é {formatToday()}
      </Text>

      {!loading && (
        <>
          <View style={{ marginBottom: spacing.lg }}>
            <NextDoseCard
              dose={nextDose}
              onConfirmTaken={handleConfirmTaken}
              onSnooze={handleSnooze}
              onSkip={handleSkip}
            />
          </View>

          <View style={{ marginBottom: spacing.lg }}>
            <ShortcutsGrid
              shortcuts={[
                { key: "meds", label: "Meus medicamentos", icon: "medkit-outline", onPress: () => navigation.navigate("MedicationsTab") },
                { key: "calendar", label: "Calendário", icon: "calendar-outline", onPress: () => navigation.navigate("CalendarTab") },
                { key: "history", label: "Histórico", icon: "time-outline", onPress: () => navigation.navigate("MoreTab", { screen: "History" }) },
                { key: "stock", label: "Estoque", icon: "cube-outline", onPress: () => navigation.navigate("MoreTab", { screen: "Stock" }) },
              ]}
            />
          </View>

          <View style={{ marginBottom: spacing.lg }}>
            <SummaryCard {...summary} />
          </View>

          {aiEnabled && (
            <View style={{ marginBottom: spacing.lg }}>
              <AIAssistantCard onPressChat={() => navigation.navigate("MoreTab", { screen: "AIAssistant" })} />
            </View>
          )}

          <NextAppointmentCard
            appointment={
              nextAppointment
                ? {
                    professionalName: nextAppointment.professional_name,
                    specialty: nextAppointment.specialty ?? "",
                    date: nextAppointment.appointment_date.split("-").reverse().join("/"),
                    time: nextAppointment.appointment_time?.slice(0, 5) ?? "",
                  }
                : null
            }
            onPress={() => navigation.navigate("MoreTab", { screen: "Appointments" })}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  greeting: { fontWeight: "700" },
});
