-- Add closed field to applications table
ALTER TABLE applications ADD COLUMN closed BOOLEAN NOT NULL DEFAULT false;

-- Add closed_at timestamp to track when the application was closed
ALTER TABLE applications ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;

-- Add closed_by field to track who closed the application
ALTER TABLE applications ADD COLUMN closed_by UUID REFERENCES auth.users(id);