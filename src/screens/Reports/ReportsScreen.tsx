import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { buildReport, ReportSummary } from "@/services/reports/reportsService";
import { hasFeature } from "@/config/featureFlags";

type Period = "week" | "month" | "quarter";

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function computeRange(period: Period): { start: string; end: string; label: string } {
  const today = new Date();
  if (period === "week") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start: toIso(start), end: toIso(today), label: "Últimos 7 dias" };
  }
  if (period === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toIso(start), end: toIso(today), label: "Este mês" };
  }
  const start = new Date(today);
  start.setDate(start.getDate() - 89);
  return { start: toIso(start), end: toIso(today), label: "Últimos 90 dias" };
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const { colors, spacing, typography } = useTheme();
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.sm }}>{label}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
          {value} ({pct}%)
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: "hidden" }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function ReportsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();

  const [period, setPeriod] = useState<Period>("week");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => computeRange(period), [period]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await buildReport(user.id, range.start, range.end);
    setSummary(result);
    setLoading(false);
  }, [user, range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleExportPdf() {
    // Estrutura preparada para a Fase 9 (Premium): a exportação em PDF
    // em si ainda não está implementada nesta fase.
    Alert.alert(
      "Em breve",
      hasFeature("pdf_export")
        ? "A exportação em PDF será implementada em uma fase futura."
        : "A exportação em PDF é um recurso Premium que chegará em breve."
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl, marginBottom: spacing.md }]}>
        Relatórios
      </Text>

      <View style={{ flexDirection: "row", marginBottom: spacing.lg }}>
        {(
          [
            { value: "week", label: "Semana" },
            { value: "month", label: "Mês" },
            { value: "quarter", label: "90 dias" },
          ] as { value: Period; label: string }[]
        ).map((opt) => {
          const selected = period === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setPeriod(opt.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderRadius: radius.pill,
                  borderColor: colors.border,
                  marginRight: spacing.xs,
                },
              ]}
            >
              <Text style={{ color: selected ? "#FFFFFF" : colors.textPrimary }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!loading && summary && (
        <>
          <Card style={{ marginBottom: spacing.md, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>ADESÃO NO PERÍODO ({range.label})</Text>
            <Text style={{ color: colors.success, fontSize: typography.size.xxl, fontWeight: "700", marginTop: 4 }}>
              {summary.adherencePercent}%
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>
              {summary.taken} de {summary.totalScheduled} doses programadas tomadas
            </Text>
          </Card>

          <Card style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
              DOSES POR STATUS
            </Text>
            <Bar label="Tomadas" value={summary.taken} total={summary.totalScheduled} color={colors.success} />
            <Bar label="Pendentes" value={summary.pending} total={summary.totalScheduled} color={colors.warning} />
            <Bar label="Adiadas" value={summary.snoozed} total={summary.totalScheduled} color={colors.ai} />
            <Bar label="Puladas" value={summary.skipped} total={summary.totalScheduled} color={colors.danger} />
            <Bar label="Não confirmadas" value={summary.unconfirmed} total={summary.totalScheduled} color={colors.textSecondary} />
          </Card>

          <View style={styles.row}>
            <Card style={[styles.smallCard, { marginRight: spacing.sm }]}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>Medicamentos ativos</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.lg }}>
                {summary.activeMedicationsCount}
              </Text>
            </Card>
            <Card style={styles.smallCard}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>Medições registradas</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.lg }}>
                {summary.measurementsCount}
              </Text>
            </Card>
          </View>

          <Card style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>Consultas no período</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: typography.size.lg }}>
              {summary.appointmentsCount}
            </Text>
          </Card>

          <Button title="Exportar PDF" variant="outline" onPress={handleExportPdf} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1 },
  row: { flexDirection: "row" },
  smallCard: { flex: 1 },
});
