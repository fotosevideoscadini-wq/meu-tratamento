import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase do app.
 *
 * IMPORTANTE — SEGURANÇA:
 * - As duas variáveis abaixo vêm do .env (nunca hardcoded).
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY é uma chave PÚBLICA por design do
 *   Supabase: a segurança real vem das políticas de Row Level Security
 *   (RLS) criadas em /supabase/policies, não do sigilo desta chave.
 * - A SERVICE_ROLE_KEY (que ignora RLS) NUNCA deve existir neste
 *   arquivo nem em nenhum código que rode no celular do usuário.
 *   Ela só pode ser usada em backend (ex: função serverless na Vercel).
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Em desenvolvimento isso é esperado até você configurar o .env.
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] Variáveis EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY " +
      "não configuradas. Veja o arquivo .env.example. O app usará dados fictícios (mocks) " +
      "enquanto isso não for configurado."
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/** True quando o Supabase real está configurado (fora do modo mock). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
