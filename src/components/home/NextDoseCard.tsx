import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { MockDose, SNOOZE_OPTIONS_MINUTES } from "@/mocks/mockHomeData";

type Props = {
  dose: MockDose | null; // null = nenhuma dose pendente
  onConfirmTaken: (doseId: string) => void;
  onSnooze: (doseId: string, minutes: number) => void;
  onSkip: (doseId: string) => void;
};

export function NextDoseCard({ dose, onConfirmTaken, onSnooze, onSkip }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const [snoozeVisible, setSnoozeVisible] = useState(false);
  const [confirmedFlash, setConfirmedFlash] = useState(false);

  if (!dose) {
    return (
      <Card style={{ alignItems: "center" }}>
        <Ionicons name="checkmark-circle" size={28} color={colors.success} />
        <Text style={{ color: colors.textPrimary, marginTop: spacing.sm, fontWeight: "600" }}>
          Nenhuma dose pendente agora
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: 2 }}>
          Você está em dia com seu tratamento.
        </Text>
      </Card>
    );
  }

  function handleTaken() {
    onConfirmTaken(dose!.id);
    setConfirmedFlash(true);
    setTimeout(() => setConfirmedFlash(false), 1800);
  }

  return (
    <Card>
      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600" }}>
        PRÓXIMA DOSE
      </Text>

      <View style={[styles.row, { marginTop: spacing.sm }]}>
        <Text style={{ color: colors.primary, fontSize: typography.size.xxl, fontWeight: "700" }}>
          {dose.time}
        </Text>
      </View>

      <Text style={{ color: colors.textPrimary, fontSize: typography.size.lg, fontWeight: "700", marginTop: spacing.xs }}>
        {dose.medicationName}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: typography.size.md, marginBottom: spacing.md }}>
        {dose.doseLabel}
      </Text>

      {confirmedFlash ? (
        <View style={[styles.confirmedBanner, { backgroundColor: colors.successLight, borderRadius: radius.sm, padding: spacing.sm }]}>
          <Text style={{ color: colors.success, fontWeight: "600" }}>✓ Dose registrada</Text>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <Button title="Tomei" variant="success" style={styles.actionButton} onPress={handleTaken} />
          <Button
            title="Adiar"
            variant="warning"
            style={styles.actionButton}
            onPress={() => setSnoozeVisible(true)}
          />
          <Button title="Pular" variant="danger" style={styles.actionButton} onPress={() => onSkip(dose.id)} />
        </View>
      )}

      <Modal transparent visible={snoozeVisible} animationType="fade" onRequestClose={() => setSnoozeVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.md, marginBottom: spacing.md }}>
              Adiar por quanto tempo?
            </Text>
            {SNOOZE_OPTIONS_MINUTES.map((min) => (
              <TouchableOpacity
                key={min}
                style={[styles.snoozeOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onSnooze(dose.id, min);
                  setSnoozeVisible(false);
                }}
              >
                <Text style={{ color: colors.textPrimary }}>{min} minutos</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.snoozeOption, { borderBottomWidth: 0 }]}
              onPress={() => setSnoozeVisible(false)}
            >
              <Text style={{ color: colors.textSecondary }}>Horário personalizado (Fase 4)</Text>
            </TouchableOpacity>
            <Button title="Cancelar" variant="outline" onPress={() => setSnoozeVisible(false)} />
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1 },
  confirmedBanner: { alignItems: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: {},
  snoozeOption: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
