import React, { useCallback, useState } from "react";
import { Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import {
  MEASUREMENT_DEFAULT_UNIT,
  MEASUREMENT_TYPE_LABEL,
  createMeasurement,
  deleteMeasurement,
  listMeasurements,
} from "@/services/measurements/measurementsService";
import type { Measurement, MeasurementType } from "@/types/database";

const TYPES: MeasurementType[] = [
  "blood_pressure",
  "glucose",
  "weight",
  "temperature",
  "heart_rate",
  "oxygen_saturation",
  "custom",
];

function formatDateTimeBr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatValue(m: Measurement): string {
  if (m.type === "blood_pressure") return `${m.value_primary}/${m.value_secondary ?? "—"} ${m.unit ?? ""}`;
  return `${m.value_primary} ${m.unit ?? ""}`;
}

export function MeasurementsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();

  const [type, setType] = useState<MeasurementType>("blood_pressure");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState("");
  const [unit, setUnit] = useState(MEASUREMENT_DEFAULT_UNIT.blood_pressure);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await listMeasurements(user.id);
    setMeasurements(data);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleSelectType(t: MeasurementType) {
    setType(t);
    setUnit(MEASUREMENT_DEFAULT_UNIT[t]);
    setPrimary("");
    setSecondary("");
    setLabel("");
  }

  async function handleSave() {
    if (!user) return;
    const primaryNum = Number(primary.replace(",", "."));
    if (!primary || Number.isNaN(primaryNum)) {
      Alert.alert("Valor inválido", "Informe um número válido.");
      return;
    }
    if (type === "custom" && label.trim().length === 0) {
      Alert.alert("Rótulo obrigatório", "Para um registro personalizado, informe um rótulo (ex: \"Dor de cabeça, escala 0-10\").");
      return;
    }

    setSaving(true);
    try {
      await createMeasurement(user.id, {
        type,
        value_primary: primaryNum,
        value_secondary: type === "blood_pressure" && secondary ? Number(secondary.replace(",", ".")) : null,
        unit: unit || null,
        label: type === "custom" ? label.trim() : null,
        measured_at: new Date().toISOString(),
        notes: notes.trim() || null,
      });
      setPrimary("");
      setSecondary("");
      setNotes("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    Alert.alert("Excluir registro", "Deseja excluir este registro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await deleteMeasurement(id); load(); } },
    ]);
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      data={measurements}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl, marginBottom: spacing.md }]}>
            Medições de Saúde
          </Text>

          <View style={[styles.disclaimer, { backgroundColor: colors.warningLight, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md }]}>
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.xs }}>
              Estes são apenas registros informados por você. O Meu Tratamento não interpreta, não diagnostica e não recomenda
              alteração de medicamento com base neles. Em caso de dúvida, procure orientação médica.
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row" }}>
              {TYPES.map((t) => {
                const selected = t === type;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => handleSelectType(t)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderRadius: radius.pill,
                        borderColor: colors.border,
                        marginRight: spacing.xs,
                      },
                    ]}
                  >
                    <Text style={{ color: selected ? "#FFFFFF" : colors.textPrimary, fontSize: 13 }}>
                      {MEASUREMENT_TYPE_LABEL[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Card style={{ marginBottom: spacing.lg }}>
            {type === "custom" && <TextField label="Rótulo" value={label} onChangeText={setLabel} placeholder="Ex: Dor de cabeça (0-10)" />}
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <TextField
                  label={type === "blood_pressure" ? "Sistólica" : "Valor"}
                  value={primary}
                  onChangeText={setPrimary}
                  keyboardType="numeric"
                />
              </View>
              {type === "blood_pressure" && (
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <TextField label="Diastólica" value={secondary} onChangeText={setSecondary} keyboardType="numeric" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <TextField label="Unidade" value={unit} onChangeText={setUnit} />
              </View>
            </View>
            <TextField label="Observações (opcional)" value={notes} onChangeText={setNotes} />
            <Button title="Registrar" onPress={handleSave} loading={saving} />
          </Card>

          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
            HISTÓRICO DE REGISTROS
          </Text>
          {!loading && measurements.length === 0 && (
            <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>Nenhum registro ainda.</Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <Card style={{ marginBottom: spacing.sm, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
              {item.type === "custom" ? item.label : MEASUREMENT_TYPE_LABEL[item.type]}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>{formatDateTimeBr(item.measured_at)}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: colors.primary, fontWeight: "700", marginRight: spacing.sm }}>{formatValue(item)}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  disclaimer: {},
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
});
