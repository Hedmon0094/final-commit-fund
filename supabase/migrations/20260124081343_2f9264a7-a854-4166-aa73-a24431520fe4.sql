-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name TEXT;
  v_phone TEXT;
  v_email TEXT;
  v_username TEXT;
BEGIN
  -- Validate and sanitize email (should always be present from auth)
  v_email := COALESCE(NULLIF(TRIM(NEW.email), ''), 'unknown@placeholder.local');
  
  -- Validate and sanitize name from metadata
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );
  
  -- Enforce max length for name (100 chars)
  v_name := LEFT(v_name, 100);
  
  -- Sanitize name: only allow letters, spaces, hyphens, apostrophes, and numbers
  IF v_name !~ '^[a-zA-Z0-9\s''\-\.]+$' THEN
    v_name := LEFT(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'), 100);
  END IF;
  
  -- Ensure name is not empty after sanitization
  IF v_name IS NULL OR v_name = '' THEN
    v_name := 'User';
  END IF;
  
  -- Generate initial username from email (can be updated later)
  v_username := LOWER(LEFT(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), 30));
  
  -- Ensure username uniqueness by appending random suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := v_username || floor(random() * 1000)::text;
    v_username := LEFT(v_username, 30);
  END LOOP;
  
  -- Validate and sanitize phone from metadata
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');
  
  IF v_phone IS NOT NULL THEN
    v_phone := regexp_replace(v_phone, '[^0-9+]', '', 'g');
    v_phone := LEFT(v_phone, 20);
    
    IF v_phone !~ '^(\+254|254|0)?[17]\d{8}$' THEN
      v_phone := NULL;
    END IF;
  END IF;
  
  INSERT INTO public.profiles (user_id, name, email, phone, username)
  VALUES (
    NEW.id,
    v_name,
    v_email,
    v_phone,
    v_username
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Profile creation encountered an issue for user %, proceeding with defaults', NEW.id;
    
    BEGIN
      INSERT INTO public.profiles (user_id, name, email, username)
      VALUES (
        NEW.id,
        COALESCE(LEFT(split_part(NEW.email, '@', 1), 100), 'User'),
        NEW.email,
        LOWER(LEFT(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), 30)) || floor(random() * 10000)::text
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Fallback profile creation also failed for user %', NEW.id;
    END;
    
    RETURN NEW;
END;
$function$;

-- Update the public_profiles view to include username
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker=on) AS
  SELECT id, user_id, name, username, is_treasurer, created_at
  FROM public.profiles;