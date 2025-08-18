-- Add missing columns for closing applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS closed_by UUID;