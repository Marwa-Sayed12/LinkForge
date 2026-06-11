import { useUser, useClerk } from "@clerk/clerk-react";
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

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  const signInWithGoogle = async () => {
    try {
      sessionStorage.setItem("redirect_after_login", "/dashboard");
      window.location.href = "https://accounts.www.linkforge.website/sign-in";
    } catch (error) {
      console.error("Google sign in failed:", error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      sessionStorage.setItem("clerk_signup_email", email);
      sessionStorage.setItem("redirect_after_login", "/dashboard");
      window.location.href = "https://accounts.www.linkforge.website/sign-up";
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign up failed") };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      sessionStorage.setItem("clerk_signin_email", email);
      sessionStorage.setItem("redirect_after_login", "/dashboard");
      window.location.href = "https://accounts.www.linkforge.website/sign-in";
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign in failed") };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      sessionStorage.setItem("clerk_reset_email", email);
      window.location.href = "https://accounts.www.linkforge.website/sign-in#/reset-password";
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Password reset failed") };
    }
  };

  const signOut = async () => {
    await clerkSignOut();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        loading,
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
  if (!ctx) throw new Error("useAuth must be used within ClerkAuthProvider");
  return ctx;
}