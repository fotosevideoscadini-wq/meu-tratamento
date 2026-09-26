import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/delete-account
 * Header: Authorization: Bearer <supabase_access_token>
 *
 * Exclui a conta do usuário autenticado e, por cascata (ON DELETE
 * CASCADE definido em todas as tabelas de /supabase/migrations),
 * todos os seus dados: profile, medicamentos, horários, doses,
 * consultas, medições, vínculos de cuidador e configurações.
 *
 * Excluir um usuário do Supabase Auth exige a service role — por
 * isso esta operação só pode acontecer aqui, nunca no app mobile
 * (mesmo princípio de segurança do /api/assistant).
 */

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  try {
    const authHeader = req.headers.authorization ?? "";
    const accessToken = authHeader.replace("Bearer ", "");
    if (!accessToken) return res.status(401).json({ error: "Não autenticado." });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Valida o token e obtém o usuário — só é possível excluir a
    // PRÓPRIA conta, nunca uma passada por parâmetro.
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData?.user) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("Erro ao excluir usuário:", deleteError);
      return res.status(500).json({ error: "Não foi possível excluir a conta agora." });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Erro no /api/delete-account:", err);
    return res.status(500).json({ error: "Erro interno ao excluir a conta." });
  }
}
