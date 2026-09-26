import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { getStockOverview, StockOverviewItem } from "@/services/stock/stockService";
import type { MoreStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MoreStackParamList, "Stock">;

export function StockScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  const [items, setItems] = useState<StockOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const overview = await getStockOverview(user.id);
    setItems(overview);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>Estoque</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: 4 }}>
          Estimativa baseada nos horários cadastrados de cada medicamento.
        </Text>
      </View>

      {!loading && items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={40} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" }}>
            Nenhum medicamento com controle de estoque cadastrado.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.medication.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.md, flex: 1 }}>
                  {item.medication.name}
                </Text>
                {item.isLow && (
                  <View style={[styles.badge, { backgroundColor: colors.dangerLight, borderRadius: radius.pill }]}>
                    <Text style={{ color: colors.danger, fontSize: 11, fontWeight: "700" }}>ACABANDO</Text>
                  </View>
                )}
              </View>

              <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                {item.medication.stock_quantity} {item.medication.dose_unit ?? "unidade(s)"} em estoque
              </Text>

              {item.daysRemaining != null ? (
                <Text style={{ color: item.isLow ? colors.danger : colors.textSecondary, marginTop: 2, fontSize: typography.size.sm }}>
                  Deve durar aproximadamente {item.daysRemaining} {item.daysRemaining === 1 ? "dia" : "dias"}
                </Text>
              ) : (
                <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: typography.size.sm }}>
                  Sem horários cadastrados para estimar duração.
                </Text>
              )}

              {item.medication.stock_alert_threshold != null && (
                <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: 4 }}>
                  Avisar quando restarem {item.medication.stock_alert_threshold} {item.medication.dose_unit ?? ""}
                </Text>
              )}
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  row: { flexDirection: "row", alignItems: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
});
