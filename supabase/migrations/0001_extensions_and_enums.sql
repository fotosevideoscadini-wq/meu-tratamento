-- =========================================================
-- MEU TRATAMENTO — Migration 0001: extensões e enums
-- =========================================================
-- Rode este arquivo (e os seguintes, em ordem) no
-- Supabase Dashboard > SQL Editor.

create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- Plano do usuário (arquitetura Premium — Fase 9 liga a cobrança)
create type plan_type as enum ('free', 'premium');

-- Frequência de uso do medicamento
create type frequency_type as enum (
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'every_x_hours',
  'specific_weekdays',
  'custom_schedule'
);

-- Status de uma dose agendada
create type dose_status as enum (
  'pending',
  'taken',
  'snoozed',
  'skipped',
  'unconfirmed'
);

-- Status do medicamento
create type medication_status as enum ('active', 'paused', 'finished');

-- Tipo de medição de saúde
create type measurement_type as enum (
  'blood_pressure',
  'glucose',
  'weight',
  'temperature',
  'heart_rate',
  'oxygen_saturation',
  'custom'
);

-- Papel de um cuidador vinculado ao usuário
create type caregiver_status as enum ('pending', 'active', 'revoked');
