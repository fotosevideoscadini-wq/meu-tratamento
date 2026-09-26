import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function PremiumBadge() {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.ai, borderRadius: radius.pill }]}>
      <Text style={styles.text}>PREMIUM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  text: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
});
