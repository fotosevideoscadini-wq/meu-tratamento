/**
 * Serviço de lembretes/notificações locais.
 *
 * Agenda uma notificação local para cada dose pendente, com botões
 * de ação (Tomei / Adiar / Pular) diretamente na notificação, usando
 * `expo-notifications`. Funciona OFFLINE — não depende do backend
 * nem da IA. Em modo mock (sem Supabase configurado) as notificações
 * ainda são agendadas de verdade no aparelho, sobre os dados locais.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CATEGORY_DOSE_REMINDER = "dose_reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Deve ser chamado uma vez na inicialização do app. */
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(CATEGORY_DOSE_REMINDER, [
    { identifier: "TAKEN", buttonTitle: "Tomei" },
    { identifier: "SNOOZE_15", buttonTitle: "Adiar 15 min" },
    { identifier: "SKIP", buttonTitle: "Pular" },
  ]);

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("dose-reminders", {
      name: "Lembretes de medicamento",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Agenda o lembrete de uma dose específica.
 * `doseId` vai no `data` da notificação para que o app saiba, ao
 * responder a ação, qual dose atualizar no banco (ver dosesService).
 */
export async function scheduleDoseReminder(params: {
  doseId: string;
  medicationName: string;
  doseLabel: string;
  triggerDate: Date;
}): Promise<string> {
  const secondsFromNow = Math.max(1, Math.round((params.triggerDate.getTime() - Date.now()) / 1000));
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Hora do seu medicamento",
      body: `${params.medicationName} — ${params.doseLabel}`,
      data: { doseId: params.doseId },
      categoryIdentifier: CATEGORY_DOSE_REMINDER,
    },
    trigger: { seconds: secondsFromNow, channelId: "dose-reminders" },
  });
  return notificationId;
}

export async function cancelDoseReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/** Agenda o lembrete de uma consulta (sem botões de ação, apenas aviso). */
export async function scheduleAppointmentReminder(params: {
  appointmentId: string;
  title: string;
  body: string;
  triggerDate: Date;
}): Promise<string> {
  const secondsFromNow = Math.max(1, Math.round((params.triggerDate.getTime() - Date.now()) / 1000));
  return Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: { appointmentId: params.appointmentId },
    },
    trigger: { seconds: secondsFromNow },
  });
}

/** Reagenda a notificação de uma dose adiada para um novo horário. */
export async function rescheduleDoseReminder(
  previousNotificationId: string | null,
  params: { doseId: string; medicationName: string; doseLabel: string; triggerDate: Date }
): Promise<string> {
  if (previousNotificationId) {
    await cancelDoseReminder(previousNotificationId);
  }
  return scheduleDoseReminder(params);
}

/**
 * Registra o listener de resposta às ações da notificação
 * (Tomei / Adiar 15 min / Pular). O app chama isto uma vez, passando
 * um callback que sabe atualizar a dose correspondente no banco
 * (via dosesService) — mantendo este arquivo sem depender da
 * camada de dados diretamente.
 */
export function addDoseActionListener(
  onAction: (doseId: string, action: "TAKEN" | "SNOOZE_15" | "SKIP" | "OPEN") => void
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const doseId = response.notification.request.content.data?.doseId as string | undefined;
    if (!doseId) return;
    const actionId = response.actionIdentifier;
    if (actionId === "TAKEN" || actionId === "SNOOZE_15" || actionId === "SKIP") {
      onAction(doseId, actionId);
    } else {
      onAction(doseId, "OPEN"); // usuário tocou no corpo da notificação
    }
  });
}
