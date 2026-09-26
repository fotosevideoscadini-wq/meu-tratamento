import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import {
  createAppointment,
  getAppointment,
  updateAppointment,
} from "@/services/appointments/appointmentsService";
import { requestNotificationPermission, scheduleAppointmentReminder } from "@/services/notifications/notificationService";
import type { MoreStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MoreStackParamList, "AppointmentForm">;
type Route = RouteProp<MoreStackParamList, "AppointmentForm">;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function AppointmentFormScreen() {
  const { colors, spacing, typography } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const appointmentId = params?.appointmentId;
  const isEditing = Boolean(appointmentId);

  const [professionalName, setProfessionalName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isEditing);

  useEffect(() => {
    if (!appointmentId) return;
    (async () => {
      const appt = await getAppointment(appointmentId);
      if (appt) {
        setProfessionalName(appt.professional_name);
        setSpecialty(appt.specialty ?? "");
        setDate(appt.appointment_date);
        setTime(appt.appointment_time?.slice(0, 5) ?? "");
        setLocation(appt.location ?? "");
        setPhone(appt.phone ?? "");
        setNotes(appt.notes ?? "");
      }
      setLoadingInitial(false);
    })();
  }, [appointmentId]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (professionalName.trim().length < 2) next.professionalName = "Informe o nome do profissional.";
    if (!DATE_REGEX.test(date)) next.date = "Use o formato AAAA-MM-DD.";
    if (time && !TIME_REGEX.test(time)) next.time = "Use o formato HH:MM.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!user) return;
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        professional_name: professionalName.trim(),
        specialty: specialty.trim() || null,
        appointment_date: date,
        appointment_time: time || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      };

      let appt;
      if (isEditing && appointmentId) {
        await updateAppointment(appointmentId, payload);
        appt = await getAppointment(appointmentId);
      } else {
        appt = await createAppointment(user.id, payload);
      }

      if (appt) {
        const [y, m, d] = appt.appointment_date.split("-").map(Number);
        const [h, min] = (appt.appointment_time ?? "08:00").split(":").map(Number);
        const triggerDate = new Date(y, m - 1, d, h, min, 0);
        if (triggerDate.getTime() > Date.now()) {
          const granted = await requestNotificationPermission();
          if (granted) {
            await scheduleAppointmentReminder({
              appointmentId: appt.id,
              title: "Consulta agendada",
              body: `${appt.professional_name}${appt.specialty ? " — " + appt.specialty : ""}`,
              triggerDate,
            });
          }
        }
      }

      navigation.goBack();
    } catch {
      Alert.alert("Erro ao salvar", "Não foi possível salvar a consulta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingInitial) return null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
        {isEditing ? "Editar Consulta" : "Cadastrar Consulta"}
      </Text>

      <TextField label="Médico/Profissional *" value={professionalName} onChangeText={setProfessionalName} error={errors.professionalName} />
      <TextField label="Especialidade" value={specialty} onChangeText={setSpecialty} />
      <TextField label="Data (AAAA-MM-DD) *" value={date} onChangeText={setDate} placeholder="2026-10-12" error={errors.date} />
      <TextField label="Horário (HH:MM)" value={time} onChangeText={setTime} placeholder="14:30" error={errors.time} />
      <TextField label="Local" value={location} onChangeText={setLocation} />
      <TextField label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="Observações" value={notes} onChangeText={setNotes} multiline />

      <Button title={isEditing ? "Salvar alterações" : "Cadastrar consulta"} onPress={handleSubmit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700", marginBottom: 16 },
});
