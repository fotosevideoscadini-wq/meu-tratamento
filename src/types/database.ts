/**
 * Tipos do banco de dados Supabase, alinhados com as migrations
 * em /supabase/migrations. Mantidos manualmente por ora; podem
 * ser substituídos depois por `supabase gen types typescript`.
 */

export type PlanType = "free" | "premium";
export type FrequencyType =
  | "once_daily"
  | "twice_daily"
  | "three_times_daily"
  | "every_x_hours"
  | "specific_weekdays"
  | "custom_schedule";
export type DoseStatus = "pending" | "taken" | "snoozed" | "skipped" | "unconfirmed";
export type MedicationStatus = "active" | "paused" | "finished";
export type MeasurementType =
  | "blood_pressure"
  | "glucose"
  | "weight"
  | "temperature"
  | "heart_rate"
  | "oxygen_saturation"
  | "custom";
export type CaregiverStatus = "pending" | "active" | "revoked";

export type Profile = {
  id: string;
  full_name: string | null;
  greeting_name: string | null;
  avatar_url: string | null;
  theme_preference: "light" | "dark" | "system";
  plan: PlanType;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Medication = {
  id: string;
  user_id: string;
  name: string;
  active_ingredient: string | null;
  presentation: string | null;
  dose_amount: number | null;
  dose_unit: string | null;
  photo_url: string | null;
  notes: string | null;
  reason: string | null;
  frequency: FrequencyType;
  frequency_config: Record<string, unknown>;
  start_date: string;
  end_date: string | null;
  status: MedicationStatus;
  stock_quantity: number | null;
  stock_alert_threshold: number | null;
  created_at: string;
  updated_at: string;
};

export type MedicationSchedule = {
  id: string;
  medication_id: string;
  user_id: string;
  time_of_day: string;
  quantity_per_dose: number;
  created_at: string;
};

export type Dose = {
  id: string;
  user_id: string;
  medication_id: string;
  schedule_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  confirmed_at: string | null;
  status: DoseStatus;
  snoozed_to: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  professional_name: string;
  specialty: string | null;
  appointment_date: string;
  appointment_time: string | null;
  location: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Measurement = {
  id: string;
  user_id: string;
  type: MeasurementType;
  value_primary: number;
  value_secondary: number | null;
  unit: string | null;
  label: string | null;
  measured_at: string;
  notes: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  category: "stock" | "dose" | "appointment" | "caregiver" | "general";
  read_at: string | null;
  created_at: string;
};

export type CaregiverLink = {
  id: string;
  owner_user_id: string;
  caregiver_user_id: string | null;
  caregiver_email: string;
  status: CaregiverStatus;
  invited_at: string;
  accepted_at: string | null;
};

export type CaregiverPermission = {
  id: string;
  caregiver_link_id: string;
  permission_key: string;
  enabled: boolean;
};

export type UserSettings = {
  user_id: string;
  notifications_enabled: boolean;
  stock_alert_default_threshold: number;
  language: string;
  updated_at: string;
};

/**
 * Tipo `Database` no formato esperado pelo `createClient<Database>()`
 * do supabase-js. Simplificado (sem Insert/Update variants completas)
 * — suficiente para autocomplete básico nesta fase.
 */
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      medications: { Row: Medication; Insert: Partial<Medication>; Update: Partial<Medication> };
      medication_schedules: {
        Row: MedicationSchedule;
        Insert: Partial<MedicationSchedule>;
        Update: Partial<MedicationSchedule>;
      };
      doses: { Row: Dose; Insert: Partial<Dose>; Update: Partial<Dose> };
      appointments: { Row: Appointment; Insert: Partial<Appointment>; Update: Partial<Appointment> };
      measurements: { Row: Measurement; Insert: Partial<Measurement>; Update: Partial<Measurement> };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow>;
        Update: Partial<NotificationRow>;
      };
      caregiver_links: { Row: CaregiverLink; Insert: Partial<CaregiverLink>; Update: Partial<CaregiverLink> };
      caregiver_permissions: {
        Row: CaregiverPermission;
        Insert: Partial<CaregiverPermission>;
        Update: Partial<CaregiverPermission>;
      };
      user_settings: { Row: UserSettings; Insert: Partial<UserSettings>; Update: Partial<UserSettings> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      plan_type: PlanType;
      frequency_type: FrequencyType;
      dose_status: DoseStatus;
      medication_status: MedicationStatus;
      measurement_type: MeasurementType;
      caregiver_status: CaregiverStatus;
    };
  };
};
