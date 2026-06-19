import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useClerkAuth"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to Clerk sign-in with return URL
    return <Navigate to="https://accounts.www.linkforge.website/sign-in?redirect_url=https://www.linkforge.website/dashboard" replace />;
  }

  return <>{children}</>;
}