-- Migration: 20260807_dashboard_analytics_rpc_and_rls.sql
-- Description: Creates SECURITY DEFINER RPC functions for property views and inquiry tracking,
-- and configures RLS policies for inquiries.

-- 1. SECURITY DEFINER RPC to increment property views count for any visitor/student
CREATE OR REPLACE FUNCTION public.increment_property_views(prop_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = prop_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO anon, authenticated, service_role;

-- 2. SECURITY DEFINER RPC to record inquiries and increment WhatsApp / Phone clicks
CREATE OR REPLACE FUNCTION public.record_property_inquiry(
  p_property_id UUID,
  p_agent_id UUID,
  p_student_id UUID,
  p_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3. Ensure RLS policies on inquiries table allow inserting and viewing
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Agents can view own property inquiries" ON public.inquiries;

CREATE POLICY "Anyone can insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Agents can view own property inquiries" ON public.inquiries FOR SELECT USING (
  agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
