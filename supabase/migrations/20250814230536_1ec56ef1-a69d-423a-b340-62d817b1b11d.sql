-- Fix security issue: Restrict server information access to staff only
-- Drop the existing public policy
DROP POLICY "Everyone can view servers" ON public.servers;

-- Create new staff-only policy for viewing servers
CREATE POLICY "Staff can view servers" 
ON public.servers 
FOR SELECT 
USING (is_staff(auth.uid()));