import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

// Get the publishable key from environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if the key exists - if not, show a clear error
if (!PUBLISHABLE_KEY) {
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
  // Show error on screen for debugging
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; flex-direction: column;">
        <h1 style="color: red;">Configuration Error</h1>
        <p>Missing Clerk Publishable Key. Please check your environment variables.</p>
        <p style="font-size: 12px; color: gray;">VITE_CLERK_PUBLISHABLE_KEY is not set in Vercel.</p>
      </div>
    `;
  }
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        // Force Clerk to use your domain
        clerkJSUrl="https://clerk.www.linkforge.website/npm/@clerk/clerk-js@6/dist/clerk.browser.js"
      >
        <App />
      </ClerkProvider>
    </StrictMode>
  );
}








