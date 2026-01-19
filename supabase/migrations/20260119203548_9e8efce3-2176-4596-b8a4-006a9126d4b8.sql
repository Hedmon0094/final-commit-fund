-- Add api_ref column to contributions for webhook matching
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS api_ref TEXT;

-- Add index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_contributions_api_ref ON public.contributions(api_ref);