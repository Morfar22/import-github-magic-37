-- Fix security issue: Restrict server settings access to staff only
-- Drop the existing public policy
DROP POLICY "Everyone can view settings" ON public.server_settings;

-- Create new staff-only policy for viewing server settings
CREATE POLICY "Staff can view settings" 
ON public.server_settings 
FOR SELECT 
USING (is_staff(auth.uid()));