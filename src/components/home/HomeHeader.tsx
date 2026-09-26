import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";

export function HomeHeader({ onPressBell, onPressAvatar }: { onPressBell?: () => void; onPressAvatar?: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.lg }]}>
      <View style={styles.brandRow}>
        <View
          style={[
            styles.logoCircle,
            { backgroundColor: colors.primaryLight, borderRadius: radius.pill, marginRight: spacing.sm },
          ]}
        >
          <Ionicons name="medkit" size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.brand, { color: colors.textPrimary, fontSize: typography.size.lg }]}>
            Meu Tratamento
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>
            Seu tratamento, no seu ritmo.
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onPressBell} style={{ marginRight: spacing.md }} accessibilityLabel="Notificações">
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressAvatar} accessibilityLabel="Perfil">
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary, borderRadius: radius.pill },
            ]}
          >
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logoCircle: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  brand: { fontWeight: "700" },
  actionsRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});
