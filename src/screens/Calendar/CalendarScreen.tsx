import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, DateData } from "react-native-calendars";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { ensureDosesForDateRange, listDosesInRange } from "@/services/doses/dosesService";
import { listMedications } from "@/services/medications/medicationsService";
import type { Dose, Medication } from "@/types/database";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthRange(year: number, month1to12: number) {
  const start = new Date(year, month1to12 - 1, 1);
  const end = new Date(year, month1to12, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function CalendarScreen() {
  const { colors, spacing, radius, typography, isDark } = useTheme();
  const { user } = useAuth();

  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [doses, setDoses] = useState<Dose[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { start, end } = monthRange(visibleMonth.year, visibleMonth.month);
    await ensureDosesForDateRange(user.id, start, end);
    const [dosesInMonth, meds] = await Promise.all([
      listDosesInRange(user.id, start, end),
      listMedications(user.id),
    ]);
    setDoses(dosesInMonth);
    setMedications(meds);
    setLoading(false);
  }, [user, visibleMonth]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const medicationsById = useMemo(() => {
    const map: Record<string, Medication> = {};
    medications.forEach((m) => (map[m.id] = m));
    return map;
  }, [medications]);

  const markedDates = useMemo(() => {
    const byDate: Record<string, Dose[]> = {};
    doses.forEach((d) => {
      byDate[d.scheduled_date] = byDate[d.scheduled_date] ?? [];
      byDate[d.scheduled_date].push(d);
    });

    const marks: Record<string, any> = {};
    Object.entries(byDate).forEach(([date, list]) => {
      const hasSkipped = list.some((d) => d.status === "skipped");
      const hasPending = list.some((d) => d.status === "pending" || d.status === "snoozed");
      const allTaken = list.every((d) => d.status === "taken");
      const dotColor = hasSkipped ? colors.danger : allTaken ? colors.success : hasPending ? colors.warning : colors.textSecondary;
      marks[date] = { marked: true, dotColor };
    });

    marks[selectedDate] = { ...(marks[selectedDate] ?? {}), selected: true, selectedColor: colors.primary };
    return marks;
  }, [doses, selectedDate, colors]);

  const dosesForSelectedDay = useMemo(
    () => doses.filter((d) => d.scheduled_date === selectedDate).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time)),
    [doses, selectedDate]
  );

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl, marginBottom: spacing.md }]}>
        Calendário
      </Text>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <Calendar
          key={isDark ? "dark" : "light"}
          current={`${visibleMonth.year}-${String(visibleMonth.month).padStart(2, "0")}-01`}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          onMonthChange={(month: DateData) => setVisibleMonth({ year: month.year, month: month.month })}
          markedDates={markedDates}
          theme={{
            backgroundColor: colors.surface,
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.textSecondary,
            dayTextColor: colors.textPrimary,
            todayTextColor: colors.primary,
            monthTextColor: colors.textPrimary,
            arrowColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: "#FFFFFF",
            dotColor: colors.primary,
          }}
        />
      </Card>

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginTop: spacing.lg, marginBottom: spacing.sm }}>
        {formatDateBr(selectedDate)}
      </Text>

      {!loading && dosesForSelectedDay.length === 0 && (
        <Text style={{ color: colors.textSecondary }}>Nenhum medicamento programado neste dia.</Text>
      )}

      {dosesForSelectedDay.map((dose) => (
        <Card key={dose.id} style={{ marginBottom: spacing.sm, flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
              {medicationsById[dose.medication_id]?.name ?? "Medicamento"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>{dose.scheduled_time.slice(0, 5)}</Text>
          </View>
        </Card>
      ))}

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: spacing.md }}>
        Consultas e eventos aparecerão aqui junto com os medicamentos a partir da Fase 6.
      </Text>
    </ScrollView>
  );
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
});
