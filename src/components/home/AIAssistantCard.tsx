import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";

export function AIAssistantCard({ onPressChat }: { onPressChat: () => void }) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Card style={{ backgroundColor: colors.aiLight }}>
      <View style={styles.row}>
        <View
          style={[styles.iconCircle, { backgroundColor: colors.ai, borderRadius: radius.pill, marginRight: spacing.md }]}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.md }}>
            Assistente de IA
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>Precisa de ajuda?</Text>
        </View>
      </View>
      <View style={{ marginTop: spacing.md }}>
        <Button title="Conversar" style={{ backgroundColor: colors.ai }} onPress={onPressChat} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  iconCircle: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
