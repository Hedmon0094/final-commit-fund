
-- Recreate public_profiles view with SECURITY DEFINER behavior
-- This allows public access to non-sensitive profile data for stats

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = false) AS
SELECT 
    id,
    user_id,
    name,
    username,
    is_treasurer,
    created_at
FROM public.profiles;

-- Grant SELECT access to anon and authenticated roles
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

COMMENT ON VIEW public.public_profiles IS 'Public view of profiles exposing only non-sensitive data for stats display';
