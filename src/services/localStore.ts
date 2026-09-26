import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Armazenamento local genérico usado SOMENTE em modo mock (quando o
 * Supabase ainda não está configurado — ver isSupabaseConfigured).
 * Persiste em AsyncStorage para que os dados de teste sobrevivam a
 * reaberturas do app durante o desenvolvimento, sem depender de
 * nenhum backend real. Nunca deve ser usado como banco de produção.
 */

const PREFIX = "@meu_tratamento/mock/";

export async function readCollection<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export async function writeCollection<T>(key: string, items: T[]): Promise<void> {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(items));
}

export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Todas as chaves de coleção usadas pelo armazenamento local mock.
 * Mantida centralizada aqui para que a exclusão de conta em modo
 * mock (ver accountService) saiba exatamente o que apagar.
 */
export const ALL_MOCK_COLLECTION_KEYS = [
  "medications",
  "medication_schedules",
  "doses",
  "appointments",
  "measurements",
  "caregiver_links",
  "caregiver_permissions",
  "profiles",
];
