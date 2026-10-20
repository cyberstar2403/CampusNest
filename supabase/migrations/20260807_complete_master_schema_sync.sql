-- Migration: 20260807_complete_master_schema_sync.sql
-- Description: Master complete schema & RLS repair migration for CampusNest.
-- Fixes infinite recursion in profiles RLS via SECURITY DEFINER function is_admin(),
-- creates and secures the agent-documents storage bucket, reconciles all 11 tables,
-- enforces property_type constraint, and grants required permissions.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 0. SECURITY DEFINER HELPER FUNCTIONS (PREVENTS RECURSIVE RLS)
-- =================================================================

-- Helper function to check if current user is admin without triggering recursive RLS on profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- Helper function to check if current user is a verified agent
CREATE OR REPLACE FUNCTION public.is_verified_agent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_profiles
    WHERE id = auth.uid() AND verification_status = 'verified'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_verified_agent() TO anon, authenticated, service_role;

-- =================================================================
-- 1. PROFILES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 2. STUDENT PROFILES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department TEXT,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 3. AGENT PROFILES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_name TEXT,
  office_address TEXT,
  bio TEXT,
  verification_status TEXT DEFAULT 'unverified',
  verification_rejection_reason TEXT,
  rejection_reason TEXT,
  must_change_password BOOLEAN DEFAULT true,
  government_id_url TEXT,
  nin TEXT,
  selfie_url TEXT,
  rating NUMERIC DEFAULT 0.0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 4. PROPERTIES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL DEFAULT 'Self-Contain',
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  kitchen BOOLEAN DEFAULT true,
  annual_rent NUMERIC NOT NULL DEFAULT 0,
  monthly_rent NUMERIC,
  is_negotiable BOOLEAN DEFAULT false,
  additional_charges JSONB,
  address TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  distance_from_campus TEXT,
  university_id UUID,
  facilities TEXT[],
  utilities TEXT[],
  cover_image_url TEXT,
  status TEXT DEFAULT 'approved',
  availability TEXT DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  views_count INT DEFAULT 0,
  whatsapp_clicks_count INT DEFAULT 0,
  phone_clicks_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'Self-Contain',
  ADD COLUMN IF NOT EXISTS bedrooms INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS kitchen BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS annual_rent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC,
  ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS additional_charges JSONB,
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS area TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS distance_from_campus TEXT,
  ADD COLUMN IF NOT EXISTS university_id UUID,
  ADD COLUMN IF NOT EXISTS facilities TEXT[],
  ADD COLUMN IF NOT EXISTS utilities TEXT[],
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_clicks_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_clicks_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Safely normalize any legacy property_type values
UPDATE public.properties SET property_type = 'Self-Contain' WHERE property_type IN ('Self Contain', 'Self-contain', 'self-contain');
UPDATE public.properties SET property_type = 'Single Room' WHERE property_type IN ('Single-Room', 'Room', 'single room');
UPDATE public.properties SET property_type = '1 Bedroom Flat' WHERE property_type IN ('1 Bedroom', '1-Bedroom', '1 bedroom flat');
UPDATE public.properties SET property_type = '2 Bedroom Flat' WHERE property_type IN ('2 Bedroom', '2-Bedroom', '2 bedroom flat');
UPDATE public.properties SET property_type = 'Self-Contain' WHERE property_type NOT IN ('Self-Contain', 'Single Room', '1 Bedroom Flat', '2 Bedroom Flat', 'Studio');

-- Modify property_type CHECK constraint to explicitly allow only the 5 CampusNest property types
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

ALTER TABLE public.properties 
  ADD CONSTRAINT properties_property_type_check 
  CHECK (property_type IN (
    'Self-Contain', 
    'Single Room', 
    '1 Bedroom Flat', 
    '2 Bedroom Flat', 
    'Studio'
  ));

-- =================================================================
-- 5. PROPERTY IMAGES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 6. SAVED PROPERTIES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, property_id)
);

ALTER TABLE public.saved_properties
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 7. INQUIRIES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 8. REPORTS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS details TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 9. VERIFICATION REQUESTS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  government_id_url TEXT,
  nin TEXT,
  selfie_url TEXT,
  agency_name TEXT,
  office_address TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS government_id_url TEXT,
  ADD COLUMN IF NOT EXISTS nin TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS office_address TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 10. NOTIFICATIONS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 11. AUDIT LOGS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- =================================================================
-- 12. STORAGE BUCKET CREATION & POLICIES
-- =================================================================

-- Create agent-documents bucket safely if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS Policies for agent-documents
DROP POLICY IF EXISTS "Agents can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own documents" ON storage.objects;

CREATE POLICY "Agents can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    auth.uid() IS NOT NULL
  )
);

CREATE POLICY "Agents can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    public.is_admin()
  )
);

CREATE POLICY "Agents can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    public.is_admin()
  )
);

CREATE POLICY "Agents can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    public.is_admin()
  )
);

-- =================================================================
-- 13. RPC FUNCTIONS FOR ANALYTICS AND ACTIONS
-- =================================================================

-- RPC: Increment Property Views
CREATE OR REPLACE FUNCTION public.increment_property_views(prop_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = prop_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO anon, authenticated, service_role;

-- RPC: Record Property Inquiry & Increment Click Counts
CREATE OR REPLACE FUNCTION public.record_property_inquiry(
  p_property_id UUID,
  p_agent_id UUID,
  p_student_id UUID,
  p_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.inquiries (property_id, agent_id, student_id, type)
  VALUES (p_property_id, p_agent_id, p_student_id, p_type);

  IF p_type = 'whatsapp' THEN
    UPDATE public.properties
    SET whatsapp_clicks_count = COALESCE(whatsapp_clicks_count, 0) + 1
    WHERE id = p_property_id;
  ELSIF p_type = 'phone' THEN
    UPDATE public.properties
    SET phone_clicks_count = COALESCE(phone_clicks_count, 0) + 1
    WHERE id = p_property_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_property_inquiry(UUID, UUID, UUID, TEXT) TO anon, authenticated, service_role;

-- =================================================================
-- 14. NON-RECURSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for profiles (Uses is_admin() to prevent recursion!)
DROP POLICY IF EXISTS "Public profiles readable by all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Public profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id OR public.is_admin());

-- Policies for student_profiles
DROP POLICY IF EXISTS "Student profiles readable by all" ON public.student_profiles;
DROP POLICY IF EXISTS "Students can manage own profile" ON public.student_profiles;

CREATE POLICY "Student profiles readable by all" ON public.student_profiles FOR SELECT USING (true);
CREATE POLICY "Students can manage own profile" ON public.student_profiles FOR ALL USING (auth.uid() = id OR public.is_admin());

-- Policies for agent_profiles
DROP POLICY IF EXISTS "Agent profiles readable by all" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agents can update own agent profile" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agent profile insertable by self or admin" ON public.agent_profiles;

CREATE POLICY "Agent profiles readable by all" ON public.agent_profiles FOR SELECT USING (true);
CREATE POLICY "Agents can update own agent profile" ON public.agent_profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Agent profile insertable by self or admin" ON public.agent_profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- Policies for properties
DROP POLICY IF EXISTS "Approved properties readable by public" ON public.properties;
DROP POLICY IF EXISTS "Verified agents can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents or Admin can delete properties" ON public.properties;

CREATE POLICY "Approved properties readable by public" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Verified agents can insert properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = agent_id OR public.is_admin());
CREATE POLICY "Agents can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = agent_id OR public.is_admin());
CREATE POLICY "Agents or Admin can delete properties" ON public.properties FOR DELETE USING (auth.uid() = agent_id OR public.is_admin());

-- Policies for property_images
DROP POLICY IF EXISTS "Property images readable by all" ON public.property_images;
DROP POLICY IF EXISTS "Agents can insert images" ON public.property_images;
DROP POLICY IF EXISTS "Agents can delete images" ON public.property_images;

CREATE POLICY "Property images readable by all" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Agents can insert images" ON public.property_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can delete images" ON public.property_images FOR DELETE USING (true);

-- Policies for saved_properties
DROP POLICY IF EXISTS "Students can view own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Students can save properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Students can remove saved properties" ON public.saved_properties;

CREATE POLICY "Students can view own saved properties" ON public.saved_properties FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students can save properties" ON public.saved_properties FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can remove saved properties" ON public.saved_properties FOR DELETE USING (student_id = auth.uid() OR public.is_admin());

-- Policies for inquiries
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Agents can view own property inquiries" ON public.inquiries;

CREATE POLICY "Anyone can insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can view own property inquiries" ON public.inquiries FOR SELECT USING (agent_id = auth.uid() OR student_id = auth.uid() OR public.is_admin());

-- Policies for reports
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;

CREATE POLICY "Anyone can insert reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view reports" ON public.reports FOR SELECT USING (public.is_admin());

-- Policies for verification_requests
DROP POLICY IF EXISTS "Agents can view own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Agents can insert verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can manage verification requests" ON public.verification_requests;

CREATE POLICY "Agents can view own verification requests" ON public.verification_requests FOR SELECT USING (agent_id = auth.uid() OR public.is_admin());
CREATE POLICY "Agents can insert verification requests" ON public.verification_requests FOR INSERT WITH CHECK (agent_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can manage verification requests" ON public.verification_requests FOR ALL USING (public.is_admin());

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Policies for audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
