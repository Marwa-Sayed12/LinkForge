// src/pages/dashboard/Settings.tsx

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Mail, Save, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useClerkAuth"
import { toast } from "sonner";

export default function DashboardSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
      return;
    }

    if (data) {
      if (data.display_name) setDisplayName(data.display_name);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
    } else {
      // ✅ Create profile if it doesn't exist - FIXED: Don't include 'id'
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          display_name: user.fullName || user.email?.split('@')[0] || '',
          email: user.email || '',
        });

      if (insertError) {
        console.error("Error creating profile:", insertError);
        // If error is duplicate key, try fetching again
        if (insertError.code === '23505') {
          const { data: retryData } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", user.id)
            .maybeSingle();
          if (retryData) {
            if (retryData.display_name) setDisplayName(retryData.display_name);
            if (retryData.avatar_url) setAvatarUrl(retryData.avatar_url);
          }
        }
      } else {
        // Profile created, set default values
        setDisplayName(user.fullName || user.email?.split('@')[0] || '');
      }
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const newUrl = publicUrlData.publicUrl + "?t=" + Date.now();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: newUrl })
      .eq("user_id", user.id);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      setAvatarUrl(newUrl);
      toast.success("Profile photo updated!");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
        <div className="glass-card rounded-xl p-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-secondary/50 animate-pulse" />
          </div>
          <div className="h-10 bg-secondary/50 animate-pulse rounded" />
          <div className="h-10 bg-secondary/50 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings.</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative w-24 h-24 rounded-full cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Plus className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Tap to change photo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm text-muted-foreground font-mono"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
          />
        </div>

        <Button variant="hero" onClick={handleSave} disabled={saving}>
          {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
        </Button>
      </motion.div>
    </div>
  );
}