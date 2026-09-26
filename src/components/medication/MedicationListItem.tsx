import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@/components/common/Card";
import type { Medication } from "@/types/database";

const STATUS_LABEL: Record<Medication["status"], string> = {
  active: "Ativo",
  paused: "Pausado",
  finished: "Finalizado",
};

export function MedicationListItem({ medication, onPress }: { medication: Medication; onPress: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();
  const statusColor =
    medication.status === "active" ? colors.success : medication.status === "paused" ? colors.warning : colors.textSecondary;

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={{ marginBottom: spacing.sm, flexDirection: "row", alignItems: "center" }}>
        <View
          style={[styles.iconCircle, { backgroundColor: colors.primaryLight, borderRadius: radius.pill, marginRight: spacing.md }]}
        >
          <Ionicons name="medkit" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.md }}>
            {medication.name}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
            {medication.dose_amount ?? ""} {medication.dose_unit ?? ""}
          </Text>
          {medication.stock_quantity != null && (
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>
              Estoque: {medication.stock_quantity}
            </Text>
          )}
        </View>
        <Text style={{ color: statusColor, fontSize: typography.size.xs, fontWeight: "600" }}>
          {STATUS_LABEL[medication.status]}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconCircle: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
