import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import type { AuthStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen() {
  const { colors, spacing, typography } = useTheme();
  const { sendPasswordReset } = useAuth();
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error: reqError } = await sendPasswordReset(email.trim());
    setLoading(false);
    if (reqError) {
      Alert.alert("Não foi possível enviar", reqError);
      return;
    }
    Alert.alert(
      "E-mail enviado",
      "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
    );
    navigation.navigate("Login");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, justifyContent: "center" }}>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.size.xl }]}>
          Recuperar senha
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
          Informe o e-mail da sua conta para receber o link de redefinição.
        </Text>

        <TextField
          label="E-mail"
          placeholder="voce@exemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={error}
        />

        <Button title="Enviar link" onPress={handleSubmit} loading={loading} />

        <Text
          style={[styles.link, { color: colors.primary, marginTop: spacing.md }]}
          onPress={() => navigation.navigate("Login")}
        >
          Voltar para o login
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", textAlign: "center" },
  subtitle: { textAlign: "center" },
  link: { textAlign: "center" },
});
