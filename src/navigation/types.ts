/**
 * Tipos de navegação centralizados. Novas telas devem ser
 * adicionadas aqui para manter a navegação com type-safety.
 */

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MedicationsTab: undefined;
  CalendarTab: undefined;
  ReportsTab: undefined;
  MoreTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  DoseReminder: { doseId: string };
};

export type MedicationsStackParamList = {
  MedicationsList: undefined;
  MedicationDetail: { medicationId: string };
  MedicationForm: { medicationId?: string } | undefined;
};

export type MoreStackParamList = {
  More: undefined;
  History: undefined;
  Stock: undefined;
  Appointments: undefined;
  AppointmentForm: { appointmentId?: string } | undefined;
  Measurements: undefined;
  Family: undefined;
  AIAssistant: undefined;
  Plan: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
