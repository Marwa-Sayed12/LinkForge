import { useUser, useClerk } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const { isLoaded, user: clerkUser } = useUser();
  const { signOut: clerkSignOut, openSignIn } = useClerk();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                    clerkUser.primaryEmailAddress?.emailAddress || 
                    null;
      
      const syncProfile = async () => {
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("user_id", clerkUser.id)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from("profiles").insert({
              user_id: clerkUser.id,
              display_name: clerkUser.fullName || clerkUser.firstName || email?.split('@')[0] || "User",
              email: email,
              avatar_url: clerkUser.imageUrl || null,
            });
          }
        } catch (error) {
          console.error("Error syncing profile:", error);
        }
      };

      syncProfile();

      const firstName = clerkUser.firstName || 
                        clerkUser.fullName?.split(' ')[0] || 
                        email?.split('@')[0] || 
                        null;
      
      const lastName = clerkUser.lastName || 
                       (clerkUser.fullName?.split(' ').slice(1).join(' ') || null);
      
      setUser({
        id: clerkUser.id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        fullName: clerkUser.fullName || `${firstName || ''} ${lastName || ''}`.trim(),
        imageUrl: clerkUser.imageUrl,
        initials: firstName ? firstName.charAt(0).toUpperCase() : (email?.charAt(0).toUpperCase() || "U"),
      });
      setLoading(false);
    } else if (isLoaded && !clerkUser) {
      setUser(null);
      setLoading(false);
    }
  }, [isLoaded, clerkUser]);

  const signInWithGoogle = async () => {
    try {
      await openSignIn({
        afterSignInUrl: "/dashboard",
        afterSignUpUrl: "/dashboard",
        redirectUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Google sign in failed:", error);
      window.location.href = `https://accounts.www.linkforge.website/sign-in?redirect_url=${encodeURIComponent(window.location.origin + "/dashboard")}`;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      sessionStorage.setItem("clerk_signup_email", email);
      window.location.href = `https://accounts.www.linkforge.website/sign-up?redirect_url=${encodeURIComponent(window.location.origin + "/dashboard")}`;
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign up failed") };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      sessionStorage.setItem("clerk_signin_email", email);
      window.location.href = `https://accounts.www.linkforge.website/sign-in?redirect_url=${encodeURIComponent(window.location.origin + "/dashboard")}`;
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign in failed") };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      sessionStorage.setItem("clerk_reset_email", email);
      window.location.href = `https://accounts.www.linkforge.website/sign-in#/reset-password?redirect_url=${encodeURIComponent(window.location.origin + "/dashboard")}`;
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
        user,
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