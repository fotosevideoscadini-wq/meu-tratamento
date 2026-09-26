import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { TextField } from "@/components/common/TextField";
import { askAssistant } from "@/services/ai/aiClient";

type ChatMessage = { id: string; role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Quais medicamentos tenho amanhã de manhã?",
  "Quantas doses foram confirmadas esta semana?",
  "Mostre um resumo do meu histórico.",
  "Quais consultas estão próximas?",
];

export function AIAssistantScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(question?: string) {
    const text = (question ?? input).trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const { answer } = await askAssistant(text);
      setMessages((prev) => [...prev, { id: `a_${Date.now()}`, role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: "assistant", text: "Não foi possível responder agora. Tente novamente." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl }]}>Assistente de IA</Text>
        <View style={[styles.disclaimer, { backgroundColor: colors.aiLight, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm }]}>
          <Text style={{ color: colors.textPrimary, fontSize: typography.size.xs }}>
            Este assistente organiza e consulta os seus dados cadastrados. Ele não diagnostica, não prescreve e não
            recomenda alterar medicamentos — para isso, fale com seu médico.
          </Text>
        </View>
      </View>

      {messages.length === 0 && (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.sm }}>
            Experimente perguntar:
          </Text>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => handleSend(s)}
              style={[styles.suggestion, { backgroundColor: colors.surface, borderRadius: radius.sm, borderColor: colors.border, marginBottom: spacing.xs }]}
            >
              <Text style={{ color: colors.textPrimary }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              {
                alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: item.role === "user" ? colors.primary : colors.surface,
                borderRadius: radius.md,
                padding: spacing.sm,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Text style={{ color: item.role === "user" ? "#FFFFFF" : colors.textPrimary }}>{item.text}</Text>
          </View>
        )}
      />

      <View style={{ flexDirection: "row", padding: spacing.lg, paddingTop: 0, alignItems: "flex-end" }}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <TextField label="" placeholder="Pergunte algo sobre seu tratamento..." value={input} onChangeText={setInput} />
        </View>
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={sending}
          style={[styles.sendButton, { backgroundColor: colors.ai, borderRadius: radius.pill }]}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  disclaimer: {},
  suggestion: { padding: 10, borderWidth: 1 },
  bubble: { maxWidth: "85%" },
  sendButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginBottom: 4 },
});
