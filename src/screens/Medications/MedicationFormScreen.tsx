import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import {
  createMedication,
  getMedication,
  replaceSchedules,
  listSchedules,
  updateMedication,
} from "@/services/medications/medicationsService";
import type { FrequencyType } from "@/types/database";
import type { MedicationsStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MedicationsStackParamList, "MedicationForm">;
type Route = RouteProp<MedicationsStackParamList, "MedicationForm">;

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string; defaultTimes: string[] }[] = [
  { value: "once_daily", label: "Uma vez ao dia", defaultTimes: ["08:00"] },
  { value: "twice_daily", label: "Duas vezes ao dia", defaultTimes: ["08:00", "20:00"] },
  { value: "three_times_daily", label: "Três vezes ao dia", defaultTimes: ["08:00", "14:00", "20:00"] },
  { value: "custom_schedule", label: "Horários personalizados", defaultTimes: ["08:00"] },
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function MedicationFormScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const medicationId = route.params?.medicationId;
  const isEditing = Boolean(medicationId);

  const [name, setName] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [presentation, setPresentation] = useState("");
  const [doseAmount, setDoseAmount] = useState("1");
  const [doseUnit, setDoseUnit] = useState("comprimido(s)");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [frequency, setFrequency] = useState<FrequencyType>("once_daily");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [newTime, setNewTime] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlertThreshold, setStockAlertThreshold] = useState("10");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEditing);

  useEffect(() => {
    if (!medicationId) return;
    (async () => {
      const med = await getMedication(medicationId);
      if (med) {
        setName(med.name);
        setActiveIngredient(med.active_ingredient ?? "");
        setPresentation(med.presentation ?? "");
        setDoseAmount(med.dose_amount != null ? String(med.dose_amount) : "1");
        setDoseUnit(med.dose_unit ?? "comprimido(s)");
        setReason(med.reason ?? "");
        setNotes(med.notes ?? "");
        setFrequency(med.frequency);
        setStartDate(med.start_date);
        setEndDate(med.end_date ?? "");
        setStockQuantity(med.stock_quantity != null ? String(med.stock_quantity) : "");
        setStockAlertThreshold(med.stock_alert_threshold != null ? String(med.stock_alert_threshold) : "10");
      }
      const schedules = await listSchedules(medicationId);
      if (schedules.length > 0) setTimes(schedules.map((s) => s.time_of_day.slice(0, 5)));
      setLoadingInitial(false);
    })();
  }, [medicationId]);

  function handleSelectFrequency(freq: (typeof FREQUENCY_OPTIONS)[number]) {
    setFrequency(freq.value);
    if (freq.value !== "custom_schedule") {
      setTimes(freq.defaultTimes);
    }
  }

  function handleAddTime() {
    if (!TIME_REGEX.test(newTime)) {
      Alert.alert("Horário inválido", "Use o formato HH:MM, ex: 08:00");
      return;
    }
    if (times.includes(newTime)) return;
    setTimes([...times, newTime].sort());
    setNewTime("");
  }

  function handleRemoveTime(time: string) {
    setTimes(times.filter((t) => t !== time));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Informe o nome do medicamento.";
    if (!DATE_REGEX.test(startDate)) next.startDate = "Use o formato AAAA-MM-DD.";
    if (endDate && !DATE_REGEX.test(endDate)) next.endDate = "Use o formato AAAA-MM-DD.";
    if (times.length === 0) next.times = "Adicione ao menos um horário.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!user) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        active_ingredient: activeIngredient.trim() || null,
        presentation: presentation.trim() || null,
        dose_amount: doseAmount ? Number(doseAmount) : null,
        dose_unit: doseUnit.trim() || null,
        photo_url: null,
        notes: notes.trim() || null,
        reason: reason.trim() || null,
        frequency,
        frequency_config: {},
        start_date: startDate,
        end_date: endDate || null,
        stock_quantity: stockQuantity ? Number(stockQuantity) : null,
        stock_alert_threshold: stockAlertThreshold ? Number(stockAlertThreshold) : null,
      };

      let medId = medicationId;
      if (isEditing && medId) {
        await updateMedication(medId, payload);
      } else {
        const created = await createMedication(user.id, payload);
        medId = created.id;
      }

      await replaceSchedules(
        user.id,
        medId!,
        times.map((t) => ({ time_of_day: t, quantity_per_dose: Number(doseAmount) || 1 }))
      );

      navigation.goBack();
    } catch (e) {
      Alert.alert("Erro ao salvar", "Não foi possível salvar o medicamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingInitial) return null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
        {isEditing ? "Editar Medicamento" : "Cadastrar Medicamento"}
      </Text>

      <TextField label="Nome do medicamento *" value={name} onChangeText={setName} error={errors.name} />
      <TextField label="Princípio ativo (opcional)" value={activeIngredient} onChangeText={setActiveIngredient} />
      <TextField
        label="Apresentação (comprimido, cápsula, xarope...)"
        value={presentation}
        onChangeText={setPresentation}
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <TextField label="Quantidade por dose" value={doseAmount} onChangeText={setDoseAmount} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Unidade" value={doseUnit} onChangeText={setDoseUnit} />
        </View>
      </View>

      <TextField label="Motivo/indicação (opcional)" value={reason} onChangeText={setReason} />
      <TextField label="Observações" value={notes} onChangeText={setNotes} multiline />

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
        FREQUÊNCIA
      </Text>
      {FREQUENCY_OPTIONS.map((opt) => {
        const selected = frequency === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => handleSelectFrequency(opt)}
            style={[
              styles.option,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primaryLight : colors.surface,
                borderRadius: radius.sm,
                padding: spacing.sm,
                marginBottom: spacing.xs,
              },
            ]}
          >
            <Text style={{ color: selected ? colors.primary : colors.textPrimary }}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.size.sm,
          fontWeight: "600",
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        }}
      >
        HORÁRIOS
      </Text>
      <View style={styles.timesRow}>
        {times.map((t) => (
          <View
            key={t}
            style={[styles.timeChip, { backgroundColor: colors.primaryLight, borderRadius: radius.pill, marginRight: 8, marginBottom: 8 }]}
          >
            <Text style={{ color: colors.primary, marginRight: 6 }}>{t}</Text>
            <TouchableOpacity onPress={() => handleRemoveTime(t)}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {errors.times && <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 8 }}>{errors.times}</Text>}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <TextField label="Adicionar horário (HH:MM)" value={newTime} onChangeText={setNewTime} placeholder="08:00" />
        </View>
        <View style={{ justifyContent: "center" }}>
          <Button title="Adicionar" onPress={handleAddTime} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <TextField label="Data de início (AAAA-MM-DD)" value={startDate} onChangeText={setStartDate} error={errors.startDate} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Data final (opcional)"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="AAAA-MM-DD"
            error={errors.endDate}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <TextField label="Estoque inicial" value={stockQuantity} onChangeText={setStockQuantity} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Avisar quando restarem"
            value={stockAlertThreshold}
            onChangeText={setStockAlertThreshold}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
        <Button title={isEditing ? "Salvar alterações" : "Cadastrar medicamento"} onPress={handleSubmit} loading={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700", marginBottom: 16 },
  row: { flexDirection: "row" },
  option: { borderWidth: 1 },
  timesRow: { flexDirection: "row", flexWrap: "wrap" },
  timeChip: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10 },
});
