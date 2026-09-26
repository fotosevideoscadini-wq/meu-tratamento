import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function Card({ style, children, ...rest }: ViewProps) {
  const { colors, radius, spacing, shadow } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          padding: spacing.md,
          ...shadow.card,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {},
});
