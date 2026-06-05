import { useUser, useClerk } from "@clerk/react";
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
  const { signOut: clerkSignOut, openSignIn, redirectToSignIn } = useClerk();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  // Google Sign-In - Opens Clerk's modal
  const signInWithGoogle = async () => {
    try {
      await openSignIn();
    } catch (error) {
      console.error("Google sign in failed:", error);
    }
  };

  // Email/Password Sign-Up - Redirect to Clerk's sign-up page
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      // Redirect to Clerk's built-in sign-up page
      redirectToSignIn({
        redirectUrl: "/dashboard",
      });
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign up failed") };
    }
  };

  // Email/Password Sign-In - Redirect to Clerk's sign-in page
  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Redirect to Clerk's built-in sign-in page
      redirectToSignIn({
        redirectUrl: "/dashboard",
      });
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign in failed") };
    }
  };

  // Reset Password - Redirect to Clerk's reset password page
  const resetPassword = async (email: string) => {
    try {
      // Clerk handles password reset automatically
      redirectToSignIn({
        redirectUrl: "/reset-password",
      });
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
        signUp: signUpWithEmail,
        signIn: signInWithEmail,
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