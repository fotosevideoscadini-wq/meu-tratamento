import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { getProfile, setPlan } from "@/services/profile/profileService";
import { featureFlags, PremiumFeature } from "@/config/featureFlags";
import type { Profile } from "@/types/database";

const PREMIUM_FEATURES: { key: PremiumFeature; label: string }[] = [
  { key: "unlimited_medications", label: "Medicamentos ilimitados" },
  { key: "caregivers", label: "Familiares e cuidadores" },
  { key: "multiple_profiles", label: "Múltiplos perfis" },
  { key: "advanced_reports", label: "Relatórios avançados" },
  { key: "pdf_export", label: "Exportação em PDF" },
  { key: "advanced_history", label: "Histórico avançado" },
  { key: "unlimited_measurements", label: "Medições ilimitadas" },
  { key: "advanced_sync", label: "Sincronização avançada" },
  { key: "ai_assistant", label: "Assistente de IA" },
  { key: "photo_medication_recognition", label: "Reconhecimento de medicamento por foto" },
  { key: "smart_features", label: "Recursos inteligentes" },
  { key: "advanced_customization", label: "Personalizações avançadas" },
];

export function PlanScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const p = await getProfile(user.id);
    setProfileState(p);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleTogglePlan() {
    if (!user || !profile) return;
    setSaving(true);
    const nextPlan = profile.plan === "free" ? "premium" : "free";
    await setPlan(user.id, nextPlan);
    await load();
    setSaving(false);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl, marginBottom: spacing.md }]}>
        Seu Plano
      </Text>

      <Card style={{ marginBottom: spacing.md, alignItems: "center" }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>PLANO ATUAL</Text>
        <Text style={{ color: colors.primary, fontSize: typography.size.xxl, fontWeight: "700", marginTop: 4 }}>
          {profile?.plan === "premium" ? "PREMIUM" : "FREE"}
        </Text>
      </Card>

      <View
        style={[
          styles.notice,
          { backgroundColor: colors.successLight, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.lg },
        ]}
      >
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.xs }}>
          O Meu Tratamento é gratuito nesta fase. Não há cobrança real implementada.
          {featureFlags.premiumFreeForAll
            ? " Durante o desenvolvimento, todos os recursos abaixo estão liberados para teste, independente do plano."
            : ""}
        </Text>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
        RECURSOS PREMIUM (futuros)
      </Text>

      {PREMIUM_FEATURES.map((feature) => (
        <Card key={feature.key} style={{ marginBottom: spacing.xs, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.textPrimary, flex: 1 }}>{feature.label}</Text>
          <Ionicons
            name={featureFlags.premiumFreeForAll ? "checkmark-circle" : profile?.plan === "premium" ? "checkmark-circle" : "lock-closed"}
            size={20}
            color={featureFlags.premiumFreeForAll || profile?.plan === "premium" ? colors.success : colors.textSecondary}
          />
        </Card>
      ))}

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
        <Button
          title={profile?.plan === "free" ? "Simular plano Premium (teste)" : "Voltar para plano Free (teste)"}
          variant="outline"
          onPress={handleTogglePlan}
          loading={saving}
        />
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: spacing.sm, textAlign: "center" }}>
          Este botão existe só para teste da estrutura de planos — não envolve pagamento.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  notice: {},
});
