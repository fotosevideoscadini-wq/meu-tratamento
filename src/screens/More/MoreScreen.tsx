import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import type { MoreStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MoreStackParamList, "More">;

// Lista provisória — o visual final (ícones grandes, cartões) chega na FASE 3.
const ITEMS: { label: string; route: keyof MoreStackParamList; phase: string }[] = [
  { label: "Histórico", route: "History", phase: "disponível agora" },
  { label: "Estoque", route: "Stock", phase: "disponível agora" },
  { label: "Consultas", route: "Appointments", phase: "disponível agora" },
  { label: "Medições de saúde", route: "Measurements", phase: "disponível agora" },
  { label: "Família e cuidadores", route: "Family", phase: "disponível agora" },
  { label: "Assistente de IA", route: "AIAssistant", phase: "disponível agora" },
  { label: "Seu plano (Free/Premium)", route: "Plan", phase: "disponível agora" },
  { label: "Configurações", route: "Settings", phase: "disponível agora" },
];

export function MoreScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const navigation = useNavigation<Nav>();

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>Mais</Text>

      {ITEMS.map((item) => (
        <TouchableOpacity
          key={item.route}
          onPress={() => navigation.navigate(item.route as never)}
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.md }}>{item.label}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>{item.phase}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
