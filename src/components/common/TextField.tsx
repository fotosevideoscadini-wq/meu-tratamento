import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, style, ...rest }: Props) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary, fontSize: typography.size.sm },
        ]}
      >
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            color: colors.textPrimary,
            borderRadius: radius.sm,
            fontSize: typography.size.md,
            padding: spacing.md,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, fontWeight: "500" },
  input: { borderWidth: 1 },
  error: { marginTop: 4, fontSize: 12 },
});
