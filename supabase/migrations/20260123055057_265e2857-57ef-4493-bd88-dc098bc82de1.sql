-- Update handle_new_user function with input validation and sanitization
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
BEGIN
  -- Validate and sanitize email (should always be present from auth)
  v_email := COALESCE(NULLIF(TRIM(NEW.email), ''), 'unknown@placeholder.local');
  
  -- Validate and sanitize name from metadata
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );
  
  -- Enforce max length for name (100 chars)
  v_name := LEFT(v_name, 100);
  
  -- Sanitize name: only allow letters, spaces, hyphens, apostrophes, and numbers
  -- If name contains suspicious characters, fallback to email username
  IF v_name !~ '^[a-zA-Z0-9\s''\-\.]+$' THEN
    v_name := LEFT(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'), 100);
  END IF;
  
  -- Ensure name is not empty after sanitization
  IF v_name IS NULL OR v_name = '' THEN
    v_name := 'User';
  END IF;
  
  -- Validate and sanitize phone from metadata
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');
  
  IF v_phone IS NOT NULL THEN
    -- Remove all non-digit characters except +
    v_phone := regexp_replace(v_phone, '[^0-9+]', '', 'g');
    
    -- Enforce max length (20 chars for international numbers)
    v_phone := LEFT(v_phone, 20);
    
    -- Validate Kenyan phone format (Safaricom/Airtel)
    -- Accept: +254XXXXXXXXX, 254XXXXXXXXX, 0XXXXXXXXX where X starts with 1 or 7
    IF v_phone !~ '^(\+254|254|0)?[17]\d{8}$' THEN
      v_phone := NULL;  -- Invalid format, set to NULL
    END IF;
  END IF;
  
  INSERT INTO public.profiles (user_id, name, email, phone)
  VALUES (
    NEW.id,
    v_name,
    v_email,
    v_phone
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation - profile can be fixed later
    RAISE WARNING 'Profile creation encountered an issue for user %, proceeding with defaults', NEW.id;
    
    -- Attempt minimal profile creation
    BEGIN
      INSERT INTO public.profiles (user_id, name, email)
      VALUES (
        NEW.id,
        COALESCE(LEFT(split_part(NEW.email, '@', 1), 100), 'User'),
        NEW.email
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Fallback profile creation also failed for user %', NEW.id;
    END;
    
    RETURN NEW;
END;
$function$;