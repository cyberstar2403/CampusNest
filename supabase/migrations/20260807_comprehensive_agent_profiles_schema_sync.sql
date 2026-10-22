-- Migration: 20260807_comprehensive_agent_profiles_schema_sync.sql
-- Description: Ensures all columns expected by the CampusNest frontend exist on public.agent_profiles and reloads PostgREST schema cache.

ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS office_address TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS government_id_url TEXT,
  ADD COLUMN IF NOT EXISTS nin TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0;

-- Ensure RLS is enabled and policies are properly configured
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agent profiles readable by all" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agents can update own agent profile" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agent profile insertable by self or admin" ON public.agent_profiles;

CREATE POLICY "Agent profiles readable by all" ON public.agent_profiles FOR SELECT USING (true);

CREATE POLICY "Agents can update own agent profile" ON public.agent_profiles FOR UPDATE USING (
  auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Agent profile insertable by self or admin" ON public.agent_profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reload Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
