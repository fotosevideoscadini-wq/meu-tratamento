import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { deleteAppointment, listAppointments } from "@/services/appointments/appointmentsService";
import type { Appointment } from "@/types/database";
import type { MoreStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MoreStackParamList, "Appointments">;

function formatDateBr(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function AppointmentsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await listAppointments(user.id);
    setAppointments(data);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleDelete(appointment: Appointment) {
    Alert.alert("Excluir consulta", `Excluir a consulta com ${appointment.professional_name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await deleteAppointment(appointment.id);
          load();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>Consultas</Text>
      </View>

      {!loading && appointments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" }}>
            Nenhuma consulta cadastrada ainda.
          </Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate("AppointmentForm", { appointmentId: item.id })}>
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.md }}>
                      {item.professional_name}
                    </Text>
                    {item.specialty && <Text style={{ color: colors.textSecondary }}>{item.specialty}</Text>}
                    <Text style={{ color: colors.primary, marginTop: 4 }}>
                      {formatDateBr(item.appointment_date)} {item.appointment_time ? `às ${item.appointment_time.slice(0, 5)}` : ""}
                    </Text>
                    {item.location && (
                      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginTop: 2 }}>{item.location}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate("AppointmentForm", undefined)}
        style={[styles.fab, { backgroundColor: colors.primary, borderRadius: radius.pill }]}
        accessibilityLabel="Adicionar consulta"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  fab: { position: "absolute", right: 24, bottom: 24, width: 56, height: 56, alignItems: "center", justifyContent: "center", elevation: 4 },
});
