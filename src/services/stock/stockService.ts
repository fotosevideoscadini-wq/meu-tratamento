import { listMedications, listSchedules } from "@/services/medications/medicationsService";
import type { Medication } from "@/types/database";

export type StockOverviewItem = {
  medication: Medication;
  dailyConsumption: number; // quantidade consumida por dia, estimada pelos horários cadastrados
  daysRemaining: number | null; // null = não é possível estimar (sem estoque ou sem consumo)
  isLow: boolean;
};

/**
 * Monta a visão geral de estoque de todos os medicamentos ativos do
 * usuário, com estimativa de dias restantes baseada no consumo
 * programado (quantidade por dose × número de horários ao dia).
 */
export async function getStockOverview(userId: string): Promise<StockOverviewItem[]> {
  const medications = await listMedications(userId);
  const withStock = medications.filter((m) => m.status === "active" && m.stock_quantity != null);

  const items: StockOverviewItem[] = [];
  for (const medication of withStock) {
    const schedules = await listSchedules(medication.id);
    const dailyConsumption = schedules.reduce((sum, s) => sum + (s.quantity_per_dose || 0), 0);
    const stock = medication.stock_quantity ?? 0;
    const daysRemaining = dailyConsumption > 0 ? Math.floor(stock / dailyConsumption) : null;
    const threshold = medication.stock_alert_threshold ?? 0;
    items.push({
      medication,
      dailyConsumption,
      daysRemaining,
      isLow: stock <= threshold,
    });
  }

  // Mais urgente primeiro: estoque baixo e menos dias restantes no topo.
  return items.sort((a, b) => {
    if (a.isLow !== b.isLow) return a.isLow ? -1 : 1;
    if (a.daysRemaining == null) return 1;
    if (b.daysRemaining == null) return -1;
    return a.daysRemaining - b.daysRemaining;
  });
}
