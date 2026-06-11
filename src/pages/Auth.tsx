import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link2, Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useClerkAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

export default function Auth() {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast.success("Check your email for reset instructions");
        setMode("login");
      } else if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/dashboard");
      } else {
        if (!fullName.trim()) throw new Error("Please enter your full name");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (!agreeTerms) throw new Error("You must agree to the Terms & Privacy Policy");
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast.success("Check your email to confirm your account");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {mode === "forgot" ? "Reset Password" : mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "forgot"
                  ? "Enter your email to receive a reset link"
                  : mode === "login"
                  ? "Sign in to your LinkForge dashboard"
                  : "Start shortening links and generating QR codes"}
              </p>
            </div>

            {mode !== "forgot" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signInWithGoogle()}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            )}

            {mode !== "forgot" && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      maxLength={80}
                      className="w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 1234"
                      maxLength={20}
                      className="w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              {mode !== "forgot" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-10 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-border bg-secondary/50 pl-10 pr-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>
              )}

              {mode === "signup" && (
                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${agreeTerms ? "bg-primary border-primary" : "border-border bg-secondary/50"}`}>
                    {agreeTerms && <Check className="w-3 h-3 text-primary-foreground" />}
                  </span>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <span>
                    I agree to the <a href="/terms" className="text-primary hover:underline">Terms</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}

              <Button variant="hero" className="w-full" disabled={submitting}>
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : mode === "forgot" ? (
                  "Send Reset Link"
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              {mode === "forgot" ? (
                <button onClick={() => setMode("login")} className="text-primary hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </button>
              ) : mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:underline">Sign up</button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-primary hover:underline">Sign in</button>
                </>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
              Need help? Contact us at{" "}
              <a href="mailto:link.forge.company@gmail.com" className="text-primary hover:underline">
                link.forge.company@gmail.com
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}