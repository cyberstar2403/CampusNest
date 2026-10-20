-- Migration: 20260807_comprehensive_properties_schema_sync.sql
-- Description: Ensures all columns expected by the CampusNest frontend exist on public.properties, and reloads PostgREST schema cache.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS property_type TEXT NOT NULL DEFAULT 'Self-Contain',
  ADD COLUMN IF NOT EXISTS bedrooms INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS kitchen BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS annual_rent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC,
  ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS additional_charges TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT 'Campus Area',
  ADD COLUMN IF NOT EXISTS area TEXT NOT NULL DEFAULT 'Main Campus',
  ADD COLUMN IF NOT EXISTS distance_from_campus TEXT NOT NULL DEFAULT '5 mins walk',
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS utilities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_clicks_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_clicks_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saves_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Reload Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
