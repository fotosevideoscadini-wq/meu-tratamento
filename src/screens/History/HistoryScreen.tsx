import React, { useCallback, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { listDosesInRange } from "@/services/doses/dosesService";
import { listMedications } from "@/services/medications/medicationsService";
import type { Dose, DoseStatus, Medication } from "@/types/database";

type ViewMode = "day" | "week" | "month";

const STATUS_OPTIONS: { value: DoseStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "taken", label: "Tomado" },
  { value: "pending", label: "Pendente" },
  { value: "snoozed", label: "Adiado" },
  { value: "skipped", label: "Pulado" },
  { value: "unconfirmed", label: "Não confirmado" },
];

const STATUS_LABEL: Record<DoseStatus, string> = {
  taken: "Tomado",
  pending: "Pendente",
  snoozed: "Adiado",
  skipped: "Pulado",
  unconfirmed: "Não confirmado",
};

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function computeRange(mode: ViewMode): { start: string; end: string } {
  const today = new Date();
  if (mode === "day") return { start: toIso(today), end: toIso(today) };
  if (mode === "week") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start: toIso(start), end: toIso(today) };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: toIso(start), end: toIso(end) };
}

export function HistoryScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [statusFilter, setStatusFilter] = useState<DoseStatus | "all">("all");
  const [medicationFilter, setMedicationFilter] = useState<string>("all");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { start, end } = computeRange(viewMode);
    const [meds, dosesInRange] = await Promise.all([
      listMedications(user.id),
      listDosesInRange(user.id, start, end),
    ]);
    setMedications(meds);
    setDoses(dosesInRange);
    setLoading(false);
  }, [user, viewMode]);

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

  const filteredDoses = useMemo(() => {
    return doses
      .filter((d) => statusFilter === "all" || d.status === statusFilter)
      .filter((d) => medicationFilter === "all" || d.medication_id === medicationFilter)
      .sort((a, b) => (a.scheduled_date + a.scheduled_time < b.scheduled_date + b.scheduled_time ? 1 : -1));
  }, [doses, statusFilter, medicationFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>Histórico</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Chips
          options={[
            { value: "day", label: "Dia" },
            { value: "week", label: "Semana" },
            { value: "month", label: "Mês" },
          ]}
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: spacing.lg, marginTop: spacing.sm }}>
        <View style={{ flexDirection: "row" }}>
          <FilterChip
            label="Todos os medicamentos"
            selected={medicationFilter === "all"}
            onPress={() => setMedicationFilter("all")}
          />
          {medications.map((m) => (
            <FilterChip
              key={m.id}
              label={m.name}
              selected={medicationFilter === m.id}
              onPress={() => setMedicationFilter(m.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
        <Chips
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as DoseStatus | "all")}
        />
      </View>

      {!loading && filteredDoses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: colors.textSecondary }}>Nenhum registro para os filtros selecionados.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
                  {medicationsById[item.medication_id]?.name ?? "Medicamento"}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
                  {formatDateBr(item.scheduled_date)} às {item.scheduled_time.slice(0, 5)}
                </Text>
              </View>
              <Text style={{ color: statusColor(item.status, colors), fontWeight: "600", fontSize: typography.size.sm }}>
                {STATUS_LABEL[item.status]}
              </Text>
            </Card>
          )}
        />
      )}
    </View>
  );
}

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function statusColor(status: DoseStatus, colors: ReturnType<typeof useTheme>["colors"]) {
  if (status === "taken") return colors.success;
  if (status === "skipped") return colors.danger;
  if (status === "snoozed") return colors.warning;
  return colors.textSecondary;
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderRadius: radius.pill,
                marginRight: spacing.xs,
                marginBottom: spacing.xs,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: selected ? "#FFFFFF" : colors.textPrimary, fontSize: 13 }}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primaryLight : colors.surface,
          borderRadius: radius.pill,
          marginRight: spacing.xs,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={{ color: selected ? colors.primary : colors.textPrimary, fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
});
