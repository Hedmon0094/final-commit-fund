-- Create a security definer function to check if user is treasurer
CREATE OR REPLACE FUNCTION public.is_treasurer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_treasurer = true
  )
$$;

-- Create a public view for group features (excludes sensitive data)
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  name,
  is_treasurer,
  created_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view contributions" ON public.contributions;

-- Profiles: Users can only view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Contributions: Users can view their own, treasurers can view all
CREATE POLICY "Users can view own contributions"
ON public.contributions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_treasurer(auth.uid())
);

-- Allow service role to insert contributions (for edge functions)
CREATE POLICY "Service role can insert contributions"
ON public.contributions
FOR INSERT
WITH CHECK (true);

-- Allow service role to update contributions (for webhooks)
CREATE POLICY "Service role can update contributions"
ON public.contributions
FOR UPDATE
USING (true);