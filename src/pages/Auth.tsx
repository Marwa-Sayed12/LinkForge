import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignIn } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useClerkAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Auth() {
  const { user, loading } = useAuth();

  // If user is already logged in, send them to the dashboard
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  // Fallback redirect function in case the Clerk component fails to load
  const handleEmailSignIn = () => {
    window.location.href = "https://clerk.www.linkforge.website/sign-in";
  };
  const handleEmailSignUp = () => {
    window.location.href = "https://clerk.www.linkforge.website/sign-up";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <a href="/" className="flex items-center gap-2">
          <Link2 className="w-6 h-6 text-accent" />
          <span className="font-heading font-bold text-lg">
            <span className="text-foreground">Link</span>
            <span className="gradient-accent-text">Forge</span>
          </span>
        </a>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Attempt 1: Use Clerk's Official Component */}
          <div className="block">
            <SignIn
              routing="path"
              path="/auth"
              signUpUrl="/auth"
              afterSignInUrl="/dashboard"
              afterSignUpUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "glass-card rounded-2xl shadow-none border-0 p-0",
                  headerTitle: "font-heading text-2xl font-bold text-foreground text-center",
                  headerSubtitle: "text-muted-foreground text-center",
                  socialButtonsBlockButton:
                    "w-full rounded-lg border border-border bg-secondary/50 hover:bg-secondary",
                  formButtonPrimary:
                    "bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg",
                  footerActionLink: "text-primary hover:underline",
                },
              }}
            />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                Or use email
              </span>
            </div>
          </div>

          {/* Attempt 2: Fallback Redirect Buttons (if Clerk component fails) */}
          <div className="space-y-3">
            <Button
              variant="hero"
              className="w-full"
              onClick={handleEmailSignIn}
            >
              <Mail className="w-4 h-4 mr-2" />
              Sign in with Email
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={handleEmailSignUp}
                className="text-primary hover:underline"
              >
                Create account
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground border-t border-border pt-6 mt-6">
            Need help? Contact us at{" "}
            <a
              href="mailto:link.forge.company@gmail.com"
              className="text-primary hover:underline"
            >
              link.forge.company@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}