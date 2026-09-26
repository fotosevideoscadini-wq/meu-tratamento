import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import type { AuthStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

export function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const { signIn, isMockMode } = useAuth();
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!email.includes("@")) next.email = "Informe um e-mail válido.";
    if (password.length < 6) next.password = "A senha deve ter pelo menos 6 caracteres.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert("Não foi possível entrar", error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, justifyContent: "center" }}>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.xxl }]}>
          Meu Tratamento
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
          Seu tratamento, no seu ritmo.
        </Text>

        {isMockMode && (
          <View
            style={[
              styles.mockBanner,
              { backgroundColor: colors.warningLight, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md },
            ]}
          >
            <Text style={{ color: colors.textPrimary, fontSize: typography.size.xs }}>
              Modo desenvolvimento: Supabase não configurado. Qualquer e-mail/senha entra.
            </Text>
          </View>
        )}

        <TextField
          label="E-mail"
          placeholder="voce@exemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />
        <TextField
          label="Senha"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <Button title="Entrar" onPress={handleSubmit} loading={loading} />

        <Text
          style={[styles.link, { color: colors.primary, marginTop: spacing.md }]}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          Esqueci minha senha
        </Text>

        <View style={[styles.footer, { marginTop: spacing.xl }]}>
          <Text style={{ color: colors.textSecondary }}>Ainda não tem conta? </Text>
          <Text style={{ color: colors.primary, fontWeight: "600" }} onPress={() => navigation.navigate("SignUp")}>
            Criar conta
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", textAlign: "center" },
  subtitle: { textAlign: "center" },
  link: { textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center" },
  mockBanner: {},
});
