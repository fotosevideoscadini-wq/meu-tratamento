import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@/components/common/Card";

type Props = {
  total: number;
  taken: number;
  pending: number;
  skipped: number;
};

export function SummaryCard({ total, taken, pending, skipped }: Props) {
  const { colors, spacing, typography } = useTheme();

  const items: { label: string; value: number; color: string }[] = [
    { label: "programados", value: total, color: colors.textPrimary },
    { label: "tomados", value: taken, color: colors.success },
    { label: "pendentes", value: pending, color: colors.warning },
    { label: "não tomados", value: skipped, color: colors.danger },
  ];

  return (
    <Card>
      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
        RESUMO DE HOJE
      </Text>
      <View style={styles.row}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <Text style={{ color: item.color, fontSize: typography.size.xl, fontWeight: "700" }}>{item.value}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, textAlign: "center" }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  item: { alignItems: "center", flex: 1 },
});
