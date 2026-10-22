-- 20260807_add_additional_charges.sql
-- Idempotent migration to ensure the additional_charges column exists in public.properties

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS additional_charges TEXT;
