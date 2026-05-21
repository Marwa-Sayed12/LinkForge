import { useUser, useClerk } from "@clerk/react";
import { supabase } from "@/integrations/supabase/client";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  user: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function HybridAuthProvider({ children }: { children: React.ReactNode }) {
  // Clerk for Google auth
  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { openSignIn } = useClerk();
  
  // Supabase for email/password
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check Supabase session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Google Sign-In - Opens Clerk modal (shows YOUR brand!)
  const signInWithGoogle = async () => {
    await openSignIn();
  };

  // Email/Password Sign-Up - Uses Supabase (your custom form, no popup!)
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    
    if (error) return { error: new Error(error.message) };
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: new Error("This email is already registered.") };
    }
    return { error: null };
  };

  // Email/Password Sign-In - Uses Supabase (your custom form, no popup!)
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  // Reset Password - Uses Supabase
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  // Sign Out - Sign out of both
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Combine user from either source
  const user = supabaseUser || clerkUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || !clerkLoaded,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within HybridAuthProvider");
  return ctx;
}