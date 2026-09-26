import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { MOCK_USER } from "@/mocks/mockUser";

type AuthUser = {
  id: string;
  email: string | null;
  name?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isMockMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Modo mock: não há Supabase configurado ainda (fase 1/2 em progresso).
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const mockUser: AuthUser | null = isSupabaseConfigured
      ? null
      : { id: MOCK_USER.id, email: MOCK_USER.email, name: MOCK_USER.name };

    const realUser: AuthUser | null = session?.user
      ? { id: session.user.id, email: session.user.email ?? null }
      : null;

    return {
      user: isSupabaseConfigured ? realUser : mockUser,
      session,
      isLoading,
      isMockMode: !isSupabaseConfigured,

      async signIn(email, password) {
        if (!isSupabaseConfigured) {
          return { error: null }; // modo mock: sempre "funciona"
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },

      async signUp(email, password) {
        if (!isSupabaseConfigured) {
          return { error: null };
        }
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
      },

      async signOut() {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
      },

      async sendPasswordReset(email) {
        if (!isSupabaseConfigured) {
          return { error: null };
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { error: error?.message ?? null };
      },
    };
  }, [session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um <AuthProvider>");
  return ctx;
}
