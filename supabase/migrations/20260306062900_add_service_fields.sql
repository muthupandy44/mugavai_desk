-- Add missing columns to services table for IMEI and tax invoice functionality
ALTER TABLE public.services 
ADD COLUMN imei_number TEXT,
ADD COLUMN hsn_code TEXT DEFAULT '9987',
ADD COLUMN taxable_amount NUMERIC,
ADD COLUMN gst_amount NUMERIC,
ADD COLUMN amount_in_words TEXT;
