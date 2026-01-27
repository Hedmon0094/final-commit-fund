-- Add onboarding_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Update existing profiles to mark as completed if they have phone and username
UPDATE public.profiles 
SET onboarding_completed = true 
WHERE phone IS NOT NULL AND username IS NOT NULL;