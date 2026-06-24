-- ============================================
-- COMPLETE FIX: Make user_id TEXT for Clerk compatibility
-- ============================================

-- Step 1: Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS public.links DROP CONSTRAINT IF EXISTS links_user_id_fkey;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Step 2: Drop triggers that depend on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Check and change user_id columns to TEXT
-- First, check if column exists and change type
DO $$ 
BEGIN
    -- For links table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'links' AND column_name = 'user_id') THEN
        ALTER TABLE public.links ALTER COLUMN user_id TYPE TEXT;
    ELSE
        ALTER TABLE public.links ADD COLUMN user_id TEXT;
    END IF;
    
    -- For profiles table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_id') THEN
        ALTER TABLE public.profiles ALTER COLUMN user_id TYPE TEXT;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- Step 4: Drop old RLS policies on links
DROP POLICY IF EXISTS "Users can view their own links" ON public.links;
DROP POLICY IF EXISTS "Users can insert links" ON public.links;
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;
DROP POLICY IF EXISTS "Anyone can create short links" ON public.links;

-- Step 5: Create new RLS policies for links (works with Clerk text IDs)
CREATE POLICY "Anyone can create short links" ON public.links 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own links" ON public.links 
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own links" ON public.links 
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own links" ON public.links 
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- Step 6: Fix profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Step 7: Ensure links table has all required columns
ALTER TABLE public.links 
  ADD COLUMN IF NOT EXISTS original_url TEXT,
  ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 8: Create index on short_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_links_short_code ON public.links (short_code);

-- Step 9: Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'links' AND column_name = 'user_id';