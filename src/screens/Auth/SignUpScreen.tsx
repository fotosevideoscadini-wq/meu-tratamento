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

type Nav = NativeStackNavigationProp<AuthStackParamList, "SignUp">;

export function SignUpScreen() {
  const { colors, spacing, typography } = useTheme();
  const { signUp, isMockMode } = useAuth();
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Informe seu nome.";
    if (!email.includes("@")) next.email = "Informe um e-mail válido.";
    if (password.length < 6) next.password = "A senha deve ter pelo menos 6 caracteres.";
    if (password !== confirmPassword) next.confirmPassword = "As senhas não coincidem.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert("Não foi possível criar a conta", error);
      return;
    }
    Alert.alert(
      "Conta criada",
      isMockMode
        ? "Modo desenvolvimento: você já pode entrar."
        : "Verifique seu e-mail para confirmar o cadastro, se essa opção estiver ativa no seu projeto Supabase."
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
          Criar conta
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
          Leva menos de um minuto.
        </Text>

        <TextField label="Nome" placeholder="Seu nome" value={name} onChangeText={setName} error={errors.name} />
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
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />
        <TextField
          label="Confirmar senha"
          placeholder="Repita a senha"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
        />

        <Button title="Criar conta" onPress={handleSubmit} loading={loading} />

        <View style={[styles.footer, { marginTop: spacing.xl }]}>
          <Text style={{ color: colors.textSecondary }}>Já tem conta? </Text>
          <Text style={{ color: colors.primary, fontWeight: "600" }} onPress={() => navigation.navigate("Login")}>
            Entrar
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: "700", textAlign: "center" },
  subtitle: { textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center" },
});
