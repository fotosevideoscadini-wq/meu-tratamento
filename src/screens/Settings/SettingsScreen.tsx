import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, ThemePreference } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/common/Button";
import { getProfile, setAiEnabled } from "@/services/profile/profileService";
import { deleteAccount } from "@/services/account/accountService";
import type { Profile } from "@/types/database";
import type { MoreStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<MoreStackParamList, "Settings">;

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Seguir aparelho" },
];

export function SettingsScreen() {
  const { colors, spacing, radius, typography, preference, setPreference } = useTheme();
  const { user, isMockMode, signOut } = useAuth();
  const navigation = useNavigation<Nav>();

  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setProfile(await getProfile(user.id));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleToggleAi(value: boolean) {
    if (!user) return;
    setProfile((prev) => (prev ? { ...prev, ai_enabled: value } : prev)); // otimista
    await setAiEnabled(user.id, value);
  }

  function handleSignOut() {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut() },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Excluir conta",
      "Isso apaga permanentemente sua conta e TODOS os seus dados (medicamentos, histórico, consultas, medições). Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            Alert.alert("Tem certeza mesmo?", "Confirme novamente para excluir sua conta definitivamente.", [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Excluir minha conta",
                style: "destructive",
                onPress: async () => {
                  if (!user) return;
                  const result = await deleteAccount(user.id);
                  if (!result.success) {
                    Alert.alert("Não foi possível excluir", result.error ?? "Tente novamente mais tarde.");
                    return;
                  }
                  await signOut();
                },
              },
            ]);
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>Configurações</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>Conta</Text>
        <Text style={{ color: colors.textPrimary, fontSize: typography.size.md, marginTop: 4 }}>{user?.email ?? "—"}</Text>
        {isMockMode && (
          <Text style={{ color: colors.warning, fontSize: typography.size.xs, marginTop: 4 }}>
            Modo desenvolvimento (Supabase não configurado)
          </Text>
        )}
        <TouchableOpacity onPress={() => navigation.navigate("Plan")} style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.primary, fontWeight: "600" }}>
            Plano atual: {profile?.plan === "premium" ? "Premium" : "Free"} — ver detalhes
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md }]}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.sm }}>Aparência</Text>
        {THEME_OPTIONS.map((opt) => {
          const selected = preference === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setPreference(opt.value)}
              style={[
                styles.option,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryLight : "transparent",
                  borderRadius: radius.sm,
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              <Text style={{ color: selected ? colors.primary : colors.textPrimary }}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Assistente de IA</Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs }}>
              Desligar aqui esconde o assistente na Home e impede novas perguntas.
            </Text>
          </View>
          <Switch value={profile?.ai_enabled ?? true} onValueChange={handleToggleAi} />
        </View>
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Sair da conta" variant="danger" onPress={handleSignOut} />
      </View>

      <View style={{ marginTop: spacing.sm }}>
        <Button title="Excluir minha conta e meus dados" variant="outline" onPress={handleDeleteAccount} />
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: spacing.lg, textAlign: "center" }}>
        A exclusão remove permanentemente sua conta e todos os dados associados (medicamentos, doses, histórico, consultas,
        medições e vínculos de cuidador).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  card: {},
  option: { borderWidth: 1 },
});
