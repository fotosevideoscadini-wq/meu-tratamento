import { supabase, isSupabaseConfigured } from "@/services/supabase/client";

/**
 * Camada de integração com IA (Assistente do "Meu Tratamento").
 *
 * ARQUITETURA DE SEGURANÇA (obrigatória — ver REGRA 3 e seção 14):
 * O app MOBILE nunca chama a API da Gemini diretamente, e a
 * GEMINI_API_KEY nunca fica no app. O fluxo real é:
 *
 *   [App React Native] --(token do usuário)--> [backend/api/assistant.ts
 *   na Vercel] --(service role)--> [Supabase] e ---> [Gemini API]
 *
 * Este arquivo só envia a pergunta e o token de acesso da sessão
 * atual — nunca dados médicos brutos, que o backend já busca sozinho
 * a partir do usuário autenticado pelo token.
 */

export type AIAssistantResponse = {
  answer: string;
  isMock: boolean;
};

const AI_BACKEND_ENDPOINT = process.env.EXPO_PUBLIC_AI_BACKEND_URL ?? ""; // ex: https://seu-projeto.vercel.app/api/assistant

export async function askAssistant(question: string): Promise<AIAssistantResponse> {
  if (!AI_BACKEND_ENDPOINT) {
    // Modo mock — nenhuma chamada de rede é feita.
    return {
      isMock: true,
      answer:
        "Assistente em modo de desenvolvimento (mock). Configure " +
        "EXPO_PUBLIC_AI_BACKEND_URL apontando para o backend implantado " +
        `(ver /backend/README.md) para respostas reais. Sua pergunta foi: "${question}"`,
    };
  }

  let accessToken: string | null = null;
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token ?? null;
  }

  if (!accessToken) {
    return {
      isMock: true,
      answer: "Você precisa estar autenticado para usar o assistente com dados reais.",
    };
  }

  const response = await fetch(AI_BACKEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível falar com o assistente agora.");
  }

  const data = await response.json();
  return { answer: data.answer as string, isMock: false };
}
