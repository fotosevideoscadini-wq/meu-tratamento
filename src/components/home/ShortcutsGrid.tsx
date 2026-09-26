import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";

type Shortcut = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function ShortcutsGrid({ shortcuts }: { shortcuts: Shortcut[] }) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={styles.grid}>
      {shortcuts.map((item) => (
        <TouchableOpacity
          key={item.key}
          onPress={item.onPress}
          style={[
            styles.item,
            { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
          ]}
        >
          <Ionicons name={item.icon} size={26} color={colors.primary} />
          <Text
            style={{ color: colors.textPrimary, fontSize: typography.size.sm, marginTop: spacing.xs, textAlign: "center" }}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  item: { width: "48%", alignItems: "center", marginBottom: 12 },
});
