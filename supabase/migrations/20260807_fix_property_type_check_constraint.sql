-- Migration: 20260807_fix_property_type_check_constraint.sql
-- Description: Updates public.properties CHECK constraint for property_type to support all approved CampusNest property types.

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

ALTER TABLE public.properties 
  ADD CONSTRAINT properties_property_type_check 
  CHECK (property_type IN (
    'Self-Contain', 
    'Self Contain', 
    'Single Room', 
    '1 Bedroom Flat', 
    '1 Bedroom', 
    '2 Bedroom Flat', 
    '2 Bedroom', 
    'Studio', 
    'Flat', 
    'House', 
    'Duplex', 
    'Room & Parlour'
  ));

NOTIFY pgrst, 'reload schema';
