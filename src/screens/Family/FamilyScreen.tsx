import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/common/Card";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { hasFeature } from "@/config/featureFlags";
import {
  PERMISSION_DEFINITIONS,
  acceptInvite,
  inviteCaregiver,
  listMyCaregivers,
  listPendingInvitesForEmail,
  listPermissions,
  listWhereIAmCaregiver,
  revokeCaregiverLink,
  setPermission,
} from "@/services/caregivers/caregiversService";
import type { CaregiverLink, CaregiverPermission } from "@/types/database";

const STATUS_LABEL: Record<CaregiverLink["status"], string> = {
  pending: "Convite pendente",
  active: "Ativo",
  revoked: "Revogado",
};

function PermissionsEditor({ linkId }: { linkId: string }) {
  const { colors, spacing } = useTheme();
  const [permissions, setPermissions] = useState<CaregiverPermission[]>([]);

  useEffect(() => {
    listPermissions(linkId).then(setPermissions);
  }, [linkId]);

  function isEnabled(key: string) {
    return permissions.find((p) => p.permission_key === key)?.enabled ?? false;
  }

  async function toggle(key: string, value: boolean) {
    await setPermission(linkId, key, value);
    setPermissions((prev) => {
      const exists = prev.find((p) => p.permission_key === key);
      if (exists) return prev.map((p) => (p.permission_key === key ? { ...p, enabled: value } : p));
      return [...prev, { id: `local_${key}`, caregiver_link_id: linkId, permission_key: key, enabled: value }];
    });
  }

  return (
    <View style={{ marginTop: spacing.sm }}>
      {PERMISSION_DEFINITIONS.map((perm) => (
        <View key={perm.key} style={styles.permRow}>
          <Text style={{ color: colors.textPrimary, flex: 1, fontSize: 13 }}>
            {perm.label}
            {perm.sensitive ? " ⚠️" : ""}
          </Text>
          <Switch value={isEnabled(perm.key)} onValueChange={(v) => toggle(perm.key, v)} />
        </View>
      ))}
    </View>
  );
}

export function FamilyScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { user } = useAuth();

  const [myCaregivers, setMyCaregivers] = useState<CaregiverLink[]>([]);
  const [caringFor, setCaringFor] = useState<CaregiverLink[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CaregiverLink[]>([]);
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [mine, caring, pending] = await Promise.all([
      listMyCaregivers(user.id),
      listWhereIAmCaregiver(user.id),
      user.email ? listPendingInvitesForEmail(user.email) : Promise.resolve([]),
    ]);
    setMyCaregivers(mine);
    setCaringFor(caring);
    setPendingInvites(pending.filter((p) => p.owner_user_id !== user.id));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleInvite() {
    if (!user || !inviteEmail.includes("@")) {
      Alert.alert("E-mail inválido", "Informe um e-mail válido para convidar.");
      return;
    }
    if (!hasFeature("caregivers")) {
      Alert.alert("Recurso Premium", "Convidar cuidadores é um recurso Premium.");
      return;
    }
    setInviting(true);
    try {
      await inviteCaregiver(user.id, inviteEmail.trim());
      setInviteEmail("");
      await load();
    } finally {
      setInviting(false);
    }
  }

  async function handleAccept(link: CaregiverLink) {
    if (!user) return;
    await acceptInvite(link.id, user.id);
    await load();
  }

  function handleRevoke(link: CaregiverLink) {
    Alert.alert("Revogar acesso", `Remover o acesso de ${link.caregiver_email}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Revogar", style: "destructive", onPress: async () => { await revokeCaregiverLink(link.id); load(); } },
    ]);
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.header, { color: colors.textPrimary, fontSize: typography.size.xl, marginBottom: spacing.md }]}>
        Família e Cuidadores
      </Text>

      {pendingInvites.length > 0 && (
        <Card style={{ marginBottom: spacing.lg, backgroundColor: colors.primaryLight }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "700", marginBottom: spacing.sm }}>
            Você foi convidado(a) para acompanhar:
          </Text>
          {pendingInvites.map((invite) => (
            <View key={invite.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: colors.textPrimary }}>Convite de {invite.owner_user_id.slice(0, 8)}...</Text>
              <Button title="Aceitar" onPress={() => handleAccept(invite)} />
            </View>
          ))}
        </Card>
      )}

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginBottom: spacing.sm }}>
        PESSOAS QUE CUIDAM DE MIM
      </Text>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.sm }}>
          Convide alguém por e-mail para acompanhar seu tratamento, com permissões que você escolhe.
        </Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <TextField label="E-mail do cuidador" value={inviteEmail} onChangeText={setInviteEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>
          <View style={{ justifyContent: "center" }}>
            <Button title="Convidar" onPress={handleInvite} loading={inviting} />
          </View>
        </View>
      </Card>

      {myCaregivers.length === 0 ? (
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>Nenhum cuidador convidado ainda.</Text>
      ) : (
        myCaregivers.map((link) => (
          <Card key={link.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>{link.caregiver_email}</Text>
                <Text style={{ color: link.status === "active" ? colors.success : colors.textSecondary, fontSize: typography.size.sm }}>
                  {STATUS_LABEL[link.status]}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setExpandedLinkId(expandedLinkId === link.id ? null : link.id)} style={{ marginRight: spacing.sm }}>
                <Ionicons name={expandedLinkId === link.id ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRevoke(link)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
            {expandedLinkId === link.id && <PermissionsEditor linkId={link.id} />}
          </Card>
        ))
      )}

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm, fontWeight: "600", marginTop: spacing.lg, marginBottom: spacing.sm }}>
        SOU CUIDADOR(A) DE
      </Text>
      {caringFor.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>Você não é cuidador(a) de ninguém no momento.</Text>
      ) : (
        caringFor.map((link) => (
          <Card key={link.id} style={{ marginBottom: spacing.sm }}>
            <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>Titular: {link.owner_user_id.slice(0, 8)}...</Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.size.sm }}>
              Você vê apenas o que foi liberado por essa pessoa.
            </Text>
          </Card>
        ))
      )}

      <Text style={{ color: colors.textSecondary, fontSize: typography.size.xs, marginTop: spacing.lg }}>
        Nenhuma permissão é concedida automaticamente. O histórico completo (⚠️) é a informação mais sensível — avalie com
        cuidado antes de liberá-la.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center" },
  permRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
});
