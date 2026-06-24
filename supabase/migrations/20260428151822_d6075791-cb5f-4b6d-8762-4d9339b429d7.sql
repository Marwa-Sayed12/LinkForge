ALTER TABLE public.links 
  ADD COLUMN IF NOT EXISTS tiny_url text,
  ADD COLUMN IF NOT EXISTS qr_settings jsonb DEFAULT '{}'::jsonb;