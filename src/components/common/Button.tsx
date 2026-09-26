import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import { useTheme } from "@/theme/ThemeContext";

type Variant = "primary" | "success" | "warning" | "danger" | "outline";

type Props = TouchableOpacityProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ title, variant = "primary", loading, disabled, style, ...rest }: Props) {
  const { colors, spacing, radius, typography } = useTheme();

  const backgroundByVariant: Record<Variant, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    outline: "transparent",
  };

  const textColor = variant === "outline" ? colors.primary : "#FFFFFF";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: backgroundByVariant[variant],
          borderRadius: radius.sm,
          paddingVertical: spacing.md,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.primary,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize: typography.size.md }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  text: { fontWeight: "600" },
});
