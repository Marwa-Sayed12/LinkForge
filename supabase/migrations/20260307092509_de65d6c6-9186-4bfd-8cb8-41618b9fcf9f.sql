
-- Drop the overly permissive policy
DROP POLICY "Anyone can insert clicks" ON public.clicks;

-- Create a more restrictive insert policy that requires a valid link_id
CREATE POLICY "Clicks can be inserted for existing links" ON public.clicks 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.links WHERE links.id = clicks.link_id AND links.is_active = true)
  );
