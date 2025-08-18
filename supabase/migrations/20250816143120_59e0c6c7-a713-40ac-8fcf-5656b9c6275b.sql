-- Update the applications status check constraint to allow 'rejected' instead of 'denied'
ALTER TABLE public.applications 
DROP CONSTRAINT applications_status_check;

ALTER TABLE public.applications 
ADD CONSTRAINT applications_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'under_review'::text]));