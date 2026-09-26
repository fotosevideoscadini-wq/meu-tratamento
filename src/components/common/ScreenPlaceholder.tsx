import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

/**
 * Placeholder padronizado para telas ainda não implementadas.
 * Usado apenas na FASE 1 (arquitetura). Cada tela real será
 * construída nas fases seguintes, substituindo este componente.
 */
export function ScreenPlaceholder({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.lg },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colors.textPrimary, fontSize: typography.size.xl },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Esta tela será implementada em: {phase}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { textAlign: "center" },
});
