-- Migration: 20260924_add_agent_suspension_and_user_management.sql
-- Description: Adds agent account suspension column, prevents privilege escalation on registration,
-- updates RLS policies to hide suspended agent properties and prevent suspended agents from publishing/editing.

-- 1. ADD SUSPENSION COLUMN TO PROFILES TABLE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Ensure default false for any existing profile records with NULL
UPDATE public.profiles
SET is_suspended = false
WHERE is_suspended IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended ON public.profiles(is_suspended);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =================================================================
-- 2. SECURITY DEFINER HELPER FUNCTIONS (PREVENTS RECURSIVE RLS)
-- =================================================================

-- Check if a specific user is an active (non-suspended) verified agent
CREATE OR REPLACE FUNCTION public.is_active_agent(p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id 
      AND role = 'agent'
      AND COALESCE(is_suspended, false) = false
      AND COALESCE(is_active, true) = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_agent(UUID) TO anon, authenticated, service_role;

-- Helper to check if caller can manage property (Admin OR Active Agent Owner)
CREATE OR REPLACE FUNCTION public.can_manage_properties(p_agent_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_admin()
    OR (
      auth.uid() = p_agent_id
      AND public.is_active_agent(auth.uid())
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_properties(UUID) TO anon, authenticated, service_role;

-- =================================================================
-- 3. SECURE AUTH REGISTRATION & PROFILE PROTECTION TRIGGERS
-- =================================================================

-- Ensure public registration NEVER assigns the admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  desired_role TEXT;
  final_role TEXT;
BEGIN
  desired_role := COALESCE(new.raw_user_meta_data->>'role', 'student');

  -- Privilege escalation prevention:
  -- Only 'agent' or 'student' can be registered publicly.
  -- Admin role must be granted explicitly by existing database administrators.
  IF desired_role = 'agent' THEN
    final_role := 'agent';
  ELSE
    final_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone_number, role, is_active, is_suspended)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone_number', new.raw_user_meta_data->>'phoneNumber'),
    final_role,
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number);

  IF (final_role = 'student') THEN
    INSERT INTO public.student_profiles (id, matric_number, department, level)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'matric_number', new.raw_user_meta_data->>'matricNumber'),
      new.raw_user_meta_data->>'department',
      new.raw_user_meta_data->>'level'
    )
    ON CONFLICT (id) DO NOTHING;
  ELSIF (final_role = 'agent') THEN
    INSERT INTO public.agent_profiles (id, agency_name, office_address, must_change_password)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'agency_name', new.raw_user_meta_data->>'agencyName'),
      COALESCE(new.raw_user_meta_data->>'office_address', new.raw_user_meta_data->>'officeAddress'),
      COALESCE((new.raw_user_meta_data->>'must_change_password')::boolean, false)
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Protect profile sensitive fields from non-admin modification
CREATE OR REPLACE FUNCTION public.check_profile_update_permissions()
RETURNS trigger AS $$
BEGIN
  IF NOT public.is_admin() THEN
    -- Prevent non-admins from changing role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only administrators can change user roles.';
    END IF;
    -- Prevent non-admins from self-suspending or self-unsuspending
    IF NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
      RAISE EXCEPTION 'Only administrators can modify agent suspension status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trig_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER trig_protect_profile_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_profile_update_permissions();

-- =================================================================
-- 4. PROPERTY ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved properties readable by public" ON public.properties;
DROP POLICY IF EXISTS "Verified agents can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Verified active agents can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Active agents can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents or Admin can delete properties" ON public.properties;

-- 1. SELECT: Public only sees approved active listings of active (non-suspended) agents.
-- Admin can view all listings for moderation. Agents can view own historical listings inside dashboard.
CREATE POLICY "Approved properties readable by public" ON public.properties
FOR SELECT USING (
  public.is_admin()
  OR agent_id = auth.uid()
  OR (
    status = 'approved'
    AND COALESCE(is_active, true) = true
    AND public.is_active_agent(agent_id)
  )
);

-- 2. INSERT: Only verified AND active (non-suspended) agents (or admin) can insert properties.
CREATE POLICY "Verified active agents can insert properties" ON public.properties
FOR INSERT WITH CHECK (
  public.is_admin()
  OR (
    auth.uid() = agent_id
    AND public.is_active_agent(auth.uid())
    AND public.is_verified_agent()
  )
);

-- 3. UPDATE: Only active (non-suspended) agents (or admin) can update properties.
CREATE POLICY "Active agents can update own properties" ON public.properties
FOR UPDATE USING (
  public.can_manage_properties(agent_id)
) WITH CHECK (
  public.can_manage_properties(agent_id)
);

-- 4. DELETE: Only active (non-suspended) agents (or admin) can delete properties.
CREATE POLICY "Agents or Admin can delete properties" ON public.properties
FOR DELETE USING (
  public.can_manage_properties(agent_id)
);

-- Policies for property_images
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can insert images" ON public.property_images;
DROP POLICY IF EXISTS "Agents can delete images" ON public.property_images;

CREATE POLICY "Agents can insert images" ON public.property_images
FOR INSERT WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_id
      AND p.agent_id = auth.uid()
      AND public.is_active_agent(auth.uid())
  )
);

CREATE POLICY "Agents can delete images" ON public.property_images
FOR DELETE USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_id
      AND p.agent_id = auth.uid()
      AND public.is_active_agent(auth.uid())
  )
);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
