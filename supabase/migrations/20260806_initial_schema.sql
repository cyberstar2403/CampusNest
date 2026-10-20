-- CampusNest Initial Schema Migration for Supabase PostgreSQL
-- Federal University Wukari (FUW) Student Accommodation Platform

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'agent', 'admin')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  matric_number TEXT,
  department TEXT,
  level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AGENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_name TEXT,
  office_address TEXT,
  bio TEXT,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_rejection_reason TEXT,
  must_change_password BOOLEAN DEFAULT true,
  government_id_url TEXT,
  nin TEXT,
  selfie_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UNIVERSITIES TABLE
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed FUW
INSERT INTO public.universities (name, code, city, state)
VALUES ('Federal University Wukari', 'FUW', 'Wukari', 'Taraba State')
ON CONFLICT (code) DO NOTHING;

-- 5. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  property_type TEXT NOT NULL, -- e.g., Self-Contain, Single Room, 1 Bedroom Flat, 2 Bedroom Flat
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  kitchen BOOLEAN DEFAULT true,
  annual_rent NUMERIC NOT NULL,
  monthly_rent NUMERIC,
  is_negotiable BOOLEAN DEFAULT false,
  additional_charges TEXT,
  address TEXT NOT NULL,
  area TEXT NOT NULL, -- e.g., Back Gate, New Site, Town, Sangere
  distance_from_campus TEXT NOT NULL, -- e.g. "5 mins walk", "10 mins drive"
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  facilities TEXT[] DEFAULT '{}',
  utilities TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  rejection_reason TEXT,
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'rented', 'maintenance')),
  views_count INT DEFAULT 0,
  whatsapp_clicks_count INT DEFAULT 0,
  phone_clicks_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_area ON public.properties(area);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(annual_rent);

-- 6. PROPERTY IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);

-- 7. SAVED PROPERTIES (FAVORITES) TABLE
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_saved_property UNIQUE (student_id, property_id)
);

-- 8. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. VERIFICATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  government_id_url TEXT NOT NULL,
  nin TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  agency_name TEXT,
  office_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INQUIRIES (CONTACT TRACKING)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'phone')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');

  INSERT INTO public.profiles (id, full_name, email, phone_number, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone_number', new.raw_user_meta_data->>'phoneNumber'),
    user_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number);

  IF (user_role = 'student') THEN
    INSERT INTO public.student_profiles (id, matric_number, department, level)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'matric_number', new.raw_user_meta_data->>'matricNumber'),
      new.raw_user_meta_data->>'department',
      new.raw_user_meta_data->>'level'
    )
    ON CONFLICT (id) DO NOTHING;
  ELSIF (user_role = 'agent') THEN
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_profiles_updated_at') THEN
    CREATE TRIGGER trig_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_student_profiles_updated_at') THEN
    CREATE TRIGGER trig_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_agent_profiles_updated_at') THEN
    CREATE TRIGGER trig_agent_profiles_updated_at BEFORE UPDATE ON public.agent_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_properties_updated_at') THEN
    CREATE TRIGGER trig_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_reports_updated_at') THEN
    CREATE TRIGGER trig_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END $$;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Public profiles are readable" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- POLICIES FOR STUDENT_PROFILES
DROP POLICY IF EXISTS "Student profiles readable by owner or admin" ON public.student_profiles;
DROP POLICY IF EXISTS "Students can update own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students can insert own student profile" ON public.student_profiles;

CREATE POLICY "Student profiles readable by owner or admin" ON public.student_profiles FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Students can update own student profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Students can insert own student profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- POLICIES FOR AGENT_PROFILES
DROP POLICY IF EXISTS "Agent profiles readable by all" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agents can update own agent profile" ON public.agent_profiles;
DROP POLICY IF EXISTS "Agent profile insertable by self or admin" ON public.agent_profiles;

CREATE POLICY "Agent profiles readable by all" ON public.agent_profiles FOR SELECT USING (true);
CREATE POLICY "Agents can update own agent profile" ON public.agent_profiles FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Agent profile insertable by self or admin" ON public.agent_profiles FOR INSERT WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- POLICIES FOR UNIVERSITIES
DROP POLICY IF EXISTS "Universities readable by public" ON public.universities;
CREATE POLICY "Universities readable by public" ON public.universities FOR SELECT USING (true);

-- POLICIES FOR PROPERTIES
DROP POLICY IF EXISTS "Approved properties readable by public" ON public.properties;
DROP POLICY IF EXISTS "Verified agents can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Agents can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Agents or Admin can delete properties" ON public.properties;

CREATE POLICY "Approved properties readable by public" ON public.properties FOR SELECT USING (
  status = 'approved' OR 
  agent_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Verified agents can insert properties" ON public.properties FOR INSERT WITH CHECK (
  agent_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.agent_profiles WHERE id = auth.uid() AND verification_status = 'verified')
);
CREATE POLICY "Agents can update own properties" ON public.properties FOR UPDATE USING (
  agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Agents or Admin can delete properties" ON public.properties FOR DELETE USING (
  agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- POLICIES FOR PROPERTY IMAGES
DROP POLICY IF EXISTS "Property images readable by public" ON public.property_images;
DROP POLICY IF EXISTS "Property owners can insert images" ON public.property_images;
DROP POLICY IF EXISTS "Property owners can delete images" ON public.property_images;

CREATE POLICY "Property images readable by public" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "Property owners can insert images" ON public.property_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Property owners can delete images" ON public.property_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')))
);

-- POLICIES FOR SAVED_PROPERTIES
DROP POLICY IF EXISTS "Students can view own saved properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Students can save properties" ON public.saved_properties;
DROP POLICY IF EXISTS "Students can remove saved properties" ON public.saved_properties;

CREATE POLICY "Students can view own saved properties" ON public.saved_properties FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can save properties" ON public.saved_properties FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can remove saved properties" ON public.saved_properties FOR DELETE USING (student_id = auth.uid());

-- POLICIES FOR REPORTS
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Students can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (
  reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students can insert reports" ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- POLICIES FOR NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- POLICIES FOR VERIFICATION_REQUESTS
DROP POLICY IF EXISTS "Agents view own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Agents can create verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.verification_requests;

CREATE POLICY "Agents view own verification requests" ON public.verification_requests FOR SELECT USING (
  agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Agents can create verification requests" ON public.verification_requests FOR INSERT WITH CHECK (agent_id = auth.uid());
CREATE POLICY "Admins can update verification requests" ON public.verification_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- STORAGE BUCKET POLICIES SUPPORT
-- (Make sure buckets 'avatars', 'property-images', 'agent-documents' exist in Supabase storage dashboard or created via API)
