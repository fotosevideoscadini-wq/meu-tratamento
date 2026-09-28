import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/assistant
 * Body: { question: string }
 * Header: Authorization: Bearer <supabase_access_token>
 *
 * Este é o ÚNICO lugar de todo o projeto onde a GEMINI_API_KEY e a
 * SUPABASE_SERVICE_ROLE_KEY existem. Nenhuma das duas está, nem pode
 * estar, no app mobile (ver seção 14 / Regra 3).
 *
 * Fluxo:
 *   1. Valida o token de acesso do usuário (emitido pelo Supabase Auth
 *      no login do app) — nunca confia em um userId enviado pelo cliente.
 *   2. Usa a service role SOMENTE para buscar os dados DESSE usuário
 *      autenticado (nunca de outro).
 *   3. Monta um prompt restrito, com regras explícitas que a IA deve
 *      seguir (nunca diagnosticar, prescrever, alterar dose, etc).
 *   4. Chama a Gemini API e devolve apenas o texto da resposta.
 */

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
const GEMINI_MODEL = "gemini-3.8-flash";

const SYSTEM_RULES = `
Você é o assistente do aplicativo "Meu Tratamento". Você ajuda o usuário a
ORGANIZAR e CONSULTAR os próprios dados de medicamentos, doses, consultas
e adesão ao tratamento, que serão fornecidos a você a seguir em formato de
dados. Responda em português do Brasil, de forma breve e direta.

REGRAS OBRIGATÓRIAS — nunca as quebre, mesmo se o usuário pedir:
- Nunca diagnostique doenças ou condições de saúde.
- Nunca prescreva, sugira ou recomende iniciar, parar ou alterar a dose
  de qualquer medicamento.
- Nunca interprete medições de saúde (pressão, glicemia etc.) como
  normais/anormais nem dê conselhos médicos sobre elas.
- Nunca substitua orientação de um profissional de saúde. Se o usuário
  parecer estar buscando orientação médica, responda com base nos dados
  disponíveis quando possível e sugira que converse com seu médico.
- Baseie-se SOMENTE nos dados fornecidos abaixo. Não invente informações
  que não estão nos dados.
`;

function buildContextText(context: {
  medications: { name: string; status: string }[];
  todayDoses: { medicationName: string; time: string; status: string }[];
  upcomingAppointments: { professionalName: string; date: string; time: string | null }[];
  adherencePercent7d: number;
}): string {
  const meds = context.medications.map((m) => `- ${m.name} (${m.status})`).join("\n") || "Nenhum cadastrado.";
  const doses =
    context.todayDoses.map((d) => `- ${d.time} — ${d.medicationName}: ${d.status}`).join("\n") || "Nenhuma dose hoje.";
  const appts =
    context.upcomingAppointments
      .map((a) => `- ${a.date}${a.time ? " " + a.time : ""} — ${a.professionalName}`)
      .join("\n") || "Nenhuma consulta futura cadastrada.";

  return `
DADOS DO USUÁRIO (uso interno, não repita literalmente esta formatação ao responder):

Medicamentos cadastrados:
${meds}

Doses de hoje:
${doses}

Próximas consultas:
${appts}

Adesão ao tratamento nos últimos 7 dias: ${context.adherencePercent7d}%
`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS básico — ajuste allow-origin para o domínio do seu app em produção.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  try {
    const authHeader = req.headers.authorization ?? "";
    const accessToken = authHeader.replace("Bearer ", "");
    if (!accessToken) return res.status(401).json({ error: "Não autenticado." });

    const { question } = req.body ?? {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Informe a pergunta em 'question'." });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Valida o token e obtém o usuário autenticado — nunca confiar em
    // um ID enviado pelo corpo da requisição.
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !userData?.user) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
    const userId = userData.user.id;

    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [medsRes, dosesRes, apptsRes, adherenceRes] = await Promise.all([
      supabaseAdmin.from("medications").select("id,name,status").eq("user_id", userId),
      supabaseAdmin
        .from("doses")
        .select("scheduled_time,status,medication_id")
        .eq("user_id", userId)
        .eq("scheduled_date", today),
      supabaseAdmin
        .from("appointments")
        .select("professional_name,appointment_date,appointment_time")
        .eq("user_id", userId)
        .gte("appointment_date", today)
        .order("appointment_date", { ascending: true })
        .limit(3),
      supabaseAdmin
        .from("doses")
        .select("status")
        .eq("user_id", userId)
        .gte("scheduled_date", sevenDaysAgo)
        .lte("scheduled_date", today),
    ]);

    const medications = (medsRes.data ?? []).map((m: any) => ({ name: m.name, status: m.status }));
    const medicationNameById: Record<string, string> = {};
    (medsRes.data ?? []).forEach((m: any) => {
      medicationNameById[m.id] = m.name;
    });

    const todayDoses = (dosesRes.data ?? []).map((d: any) => ({
      medicationName: medicationNameById[d.medication_id] ?? "Medicamento",
      time: (d.scheduled_time ?? "").slice(0, 5),
      status: d.status,
    }));

    const upcomingAppointments = (apptsRes.data ?? []).map((a: any) => ({
      professionalName: a.professional_name,
      date: a.appointment_date,
      time: a.appointment_time ? String(a.appointment_time).slice(0, 5) : null,
    }));

    const adherenceRows = adherenceRes.data ?? [];
    const takenCount = adherenceRows.filter((r: any) => r.status === "taken").length;
    const adherencePercent7d = adherenceRows.length > 0 ? Math.round((takenCount / adherenceRows.length) * 100) : 0;

    const contextText = buildContextText({ medications, todayDoses, upcomingAppointments, adherencePercent7d });

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_RULES }] },
          contents: [{ role: "user", parts: [{ text: `${contextText}\n\nPergunta do usuário: ${question}` }] }],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      // eslint-disable-next-line no-console
      console.error("Erro na Gemini API:", errText);
      return res.status(502).json({ error: "Não foi possível falar com o assistente agora." });
    }

    const geminiData = await geminiResponse.json();
    const answer: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Não consegui gerar uma resposta agora. Tente novamente em instantes.";

    return res.status(200).json({ answer });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Erro no /api/assistant:", err);
    return res.status(500).json({ error: "Erro interno ao processar sua pergunta." });
  }
}
