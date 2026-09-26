import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import {
  deleteMedication,
  getMedication,
  listSchedules,
  setMedicationStatus,
} from "@/services/medications/medicationsService";
import type { Medication, MedicationSchedule } from "@/types/database";
import type { MedicationsStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MedicationsStackParamList, "MedicationDetail">;
type Route = RouteProp<MedicationsStackParamList, "MedicationDetail">;

const FREQUENCY_LABEL: Record<Medication["frequency"], string> = {
  once_daily: "Uma vez ao dia",
  twice_daily: "Duas vezes ao dia",
  three_times_daily: "Três vezes ao dia",
  every_x_hours: "A cada X horas",
  specific_weekdays: "Dias específicos da semana",
  custom_schedule: "Horários personalizados",
};

export function MedicationDetailScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const [medication, setMedication] = useState<Medication | null>(null);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const med = await getMedication(params.medicationId);
    setMedication(med);
    if (med) setSchedules(await listSchedules(med.id));
    setLoading(false);
  }, [params.medicationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleTogglePause() {
    if (!medication) return;
    const nextStatus = medication.status === "active" ? "paused" : "active";
    setMedicationStatus(medication.id, nextStatus).then(load);
  }

  function handleDelete() {
    if (!medication) return;
    Alert.alert("Excluir medicamento", `Tem certeza que deseja excluir "${medication.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await deleteMedication(medication.id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (loading || !medication) return null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>{medication.name}</Text>
      {medication.active_ingredient && (
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>{medication.active_ingredient}</Text>
      )}

      <Card style={{ marginBottom: spacing.md }}>
        <Row label="Apresentação" value={medication.presentation ?? "—"} colors={colors} />
        <Row label="Dose" value={`${medication.dose_amount ?? "—"} ${medication.dose_unit ?? ""}`} colors={colors} />
        <Row label="Frequência" value={FREQUENCY_LABEL[medication.frequency]} colors={colors} />
        <Row label="Início" value={medication.start_date} colors={colors} />
        <Row label="Término" value={medication.end_date ?? "Sem data definida"} colors={colors} />
        {medication.reason && <Row label="Motivo" value={medication.reason} colors={colors} />}
        {medication.notes && <Row label="Observações" value={medication.notes} colors={colors} last />}
      </Card>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
          HORÁRIOS
        </Text>
        {schedules.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>Nenhum horário cadastrado.</Text>
        ) : (
          schedules.map((s) => (
            <Text key={s.id} style={{ color: colors.textPrimary, marginBottom: 4 }}>
              {s.time_of_day.slice(0, 5)} — {s.quantity_per_dose} {medication.dose_unit ?? ""}
            </Text>
          ))
        )}
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
          ESTOQUE
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: "700" }}>
          {medication.stock_quantity ?? "Não controlado"}
        </Text>
        {medication.stock_alert_threshold != null && (
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
            Avisar quando restarem {medication.stock_alert_threshold}
          </Text>
        )}
      </Card>

      <Button title="Editar" onPress={() => navigation.navigate("MedicationForm", { medicationId: medication.id })} />
      <View style={{ marginTop: spacing.sm }}>
        <Button
          title={medication.status === "active" ? "Pausar" : "Reativar"}
          variant="warning"
          onPress={handleTogglePause}
        />
      </View>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <Button title="Excluir" variant="danger" onPress={handleDelete} />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, colors, last }: { label: string; value: string; colors: any; last?: boolean }) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Text style={{ color: colors.textSecondary }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontWeight: "600", maxWidth: "60%", textAlign: "right" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
});
