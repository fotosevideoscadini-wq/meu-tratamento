/**
 * Dados fictícios para a tela Início.
 *
 * IMPORTANTE (Regra 2 / seção 39): nenhum dado real de saúde é
 * usado aqui. Estes valores existem só para a interface (FASE 3)
 * ter o que exibir antes de a FASE 4 ligar as consultas reais ao
 * Supabase (tabelas medications/doses).
 */

export type MockDoseStatus = "pending" | "taken" | "snoozed" | "skipped";

/**
 * Forma de exibição usada pelo cartão de Próxima Dose da Home.
 * A partir da FASE 4, também é usada para representar doses REAIS
 * (ver toDisplayDose em HomeScreen.tsx) — o nome "Mock" ficou apenas
 * por compatibilidade com o restante do arquivo, que segue fictício.
 */
export type MockDose = {
  id: string;
  medicationName: string;
  doseLabel: string; // ex: "1 comprimido"
  time: string; // "08:00"
  status: MockDoseStatus;
};

export const MOCK_TODAY_DOSES: MockDose[] = [
  { id: "d1", medicationName: "Losartana 50 mg", doseLabel: "1 comprimido", time: "08:00", status: "pending" },
  { id: "d2", medicationName: "Metformina 850 mg", doseLabel: "1 comprimido", time: "13:00", status: "taken" },
  { id: "d3", medicationName: "Sinvastatina 20 mg", doseLabel: "1 comprimido", time: "21:00", status: "pending" },
];

export const MOCK_NEXT_APPOINTMENT = {
  professionalName: "Dra. Fernanda Alves",
  specialty: "Cardiologia",
  date: "12/10/2026",
  time: "14:30",
};

export const SNOOZE_OPTIONS_MINUTES = [10, 15, 30, 60];
