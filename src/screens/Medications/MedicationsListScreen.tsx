import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { MedicationListItem } from "@/components/medication/MedicationListItem";
import { listMedications } from "@/services/medications/medicationsService";
import type { Medication } from "@/types/database";
import type { MedicationsStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MedicationsStackParamList, "MedicationsList">;

export function MedicationsListScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await listMedications(user.id);
    setMedications(data);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
          Meus Medicamentos
        </Text>
      </View>

      {!loading && medications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="medkit-outline" size={40} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" }}>
            Nenhum medicamento cadastrado ainda.
          </Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <MedicationListItem
              medication={item}
              onPress={() => navigation.navigate("MedicationDetail", { medicationId: item.id })}
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate("MedicationForm", undefined)}
        style={[
          styles.fab,
          { backgroundColor: colors.primary, borderRadius: radius.pill },
        ]}
        accessibilityLabel="Adicionar medicamento"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700", marginBottom: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
