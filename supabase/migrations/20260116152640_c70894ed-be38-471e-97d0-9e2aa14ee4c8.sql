-- Fix phone_otps security: Remove overly permissive policy
-- OTPs should ONLY be managed by edge functions via service role (which bypasses RLS)
-- No authenticated users should ever directly access this table

-- Drop the dangerous permissive policy
DROP POLICY IF EXISTS "Service role can manage phone_otps" ON public.phone_otps;
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.phone_otps;

-- Ensure RLS is enabled (it should be, but confirm)
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- No policies needed - service role bypasses RLS
-- This ensures NO regular users can read or write OTP records
-- Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS

-- Also fix email_otps table with same issue
DROP POLICY IF EXISTS "Service role can manage OTPs" ON public.email_otps;
DROP POLICY IF EXISTS "Service role can manage email_otps" ON public.email_otps;

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Add cleanup: Remove expired OTPs older than 1 hour for security
DELETE FROM public.phone_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
DELETE FROM public.email_otps WHERE expires_at < NOW() - INTERVAL '1 hour';