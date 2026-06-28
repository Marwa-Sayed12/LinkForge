// src/pages/Redirect.tsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link2 } from "lucide-react";

export default function Redirect() {
  const { shortCode } = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shortCode) return;
    
    // ✅ Use your Vercel API route (NOT Supabase Edge Function)
    const redirectUrl = `/api/redirect/${shortCode}`;
    console.log('Redirecting to:', redirectUrl);
    window.location.href = redirectUrl;

    // Fallback timeout
    const timer = setTimeout(() => {
      setError("Link not found or has expired.");
    }, 5000);
    return () => clearTimeout(timer);
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Link2 className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Link Not Found</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}