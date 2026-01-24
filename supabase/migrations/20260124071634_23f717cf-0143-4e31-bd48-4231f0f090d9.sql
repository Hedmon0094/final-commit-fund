-- Drop and recreate the public_profiles view with proper security
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT 
  id,
  user_id,
  name,
  is_treasurer,
  created_at
FROM public.profiles;

-- Grant access to authenticated and anon users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;