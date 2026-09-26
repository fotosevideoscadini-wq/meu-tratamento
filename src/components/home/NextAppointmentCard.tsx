import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { Card } from "@/components/common/Card";

type Props = {
  appointment: {
    professionalName: string;
    specialty: string;
    date: string;
    time: string;
  } | null;
  onPress?: () => void;
};

export function NextAppointmentCard({ appointment, onPress }: Props) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <Card>
      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
        PRÓXIMA CONSULTA
      </Text>

      {appointment ? (
        <View style={styles.row}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.primaryLight, borderRadius: radius.pill, marginRight: spacing.md }]}
          >
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{appointment.professionalName}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>{appointment.specialty}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
              {appointment.date} às {appointment.time}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={{ color: colors.textSecondary }}>Nenhuma consulta agendada.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  iconCircle: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
