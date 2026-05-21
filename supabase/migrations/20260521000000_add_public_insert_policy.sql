-- ============================================
-- Allow public URL shortening on homepage
-- Anyone can create short links without logging in
-- ============================================

-- Allow ANYONE to insert links (for homepage)
CREATE POLICY "Anyone can create short links" ON public.links 
  FOR INSERT WITH CHECK (true); 

-- Note: This policy works alongside the existing "Users can insert links" policy
-- - Logged-in users: both policies apply
-- - Non-logged-in users: only this policy applies