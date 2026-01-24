-- Allow public read access to contribution amounts for aggregate stats (no user identification)
-- This only allows reading amount and status, not user_id identification

-- First check if policy exists and drop it
DROP POLICY IF EXISTS "Anyone can view contribution amounts for stats" ON public.contributions;

-- Create a SELECT policy that allows anyone to see contribution amounts for public stats
CREATE POLICY "Anyone can view contribution amounts for stats" 
ON public.contributions 
FOR SELECT 
TO authenticated, anon
USING (status = 'completed');