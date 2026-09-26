/**
 * Sistema de Feature Flags — FREE vs PREMIUM.
 *
 * REGRA DO PROJETO (fase atual):
 * - O app é gratuito. NÃO há cobrança implementada.
 * - Durante desenvolvimento e testes, TODOS os recursos Premium
 *   ficam liberados (ver EXPO_PUBLIC_PREMIUM_FREE_FOR_ALL no .env).
 * - Quando o pagamento for implementado (fase futura), basta:
 *     1. Definir EXPO_PUBLIC_PREMIUM_FREE_FOR_ALL=false
 *     2. Ligar `isPremiumUser` ao plano real do usuário (tabela
 *        `plans`/`profiles.plan` no Supabase) em vez do valor fixo.
 *   Nenhuma tela precisa mudar: elas só devem consultar `hasFeature()`.
 */

export type PremiumFeature =
  | "unlimited_medications"
  | "caregivers"
  | "multiple_profiles"
  | "advanced_reports"
  | "pdf_export"
  | "advanced_history"
  | "unlimited_measurements"
  | "advanced_sync"
  | "ai_assistant"
  | "photo_medication_recognition"
  | "smart_features"
  | "advanced_customization";

const ALL_PREMIUM_FEATURES: PremiumFeature[] = [
  "unlimited_medications",
  "caregivers",
  "multiple_profiles",
  "advanced_reports",
  "pdf_export",
  "advanced_history",
  "unlimited_measurements",
  "advanced_sync",
  "ai_assistant",
  "photo_medication_recognition",
  "smart_features",
  "advanced_customization",
];

const PREMIUM_FREE_FOR_ALL =
  process.env.EXPO_PUBLIC_PREMIUM_FREE_FOR_ALL !== "false"; // padrão: true (dev/testes)

/**
 * Verifica se o usuário atual tem acesso a um recurso Premium.
 *
 * `userPlan` viria do perfil do usuário no Supabase (fase 2/9).
 * Por ora aceita undefined e usa a flag global de desenvolvimento.
 */
export function hasFeature(
  feature: PremiumFeature,
  userPlan?: "free" | "premium"
): boolean {
  if (PREMIUM_FREE_FOR_ALL) return true;
  if (!ALL_PREMIUM_FEATURES.includes(feature)) return true; // recurso não é premium
  return userPlan === "premium";
}

export const featureFlags = {
  premiumFreeForAll: PREMIUM_FREE_FOR_ALL,
  aiEnabled: process.env.EXPO_PUBLIC_AI_ENABLED !== "false",
};
