-- Fix RLS policies for user_roles table to allow staff to see other staff members
DROP POLICY IF EXISTS "Staff can view all user roles" ON public.user_roles;

CREATE POLICY "Staff can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (is_staff(auth.uid()));

-- Allow staff to manage other staff roles (only admins should be able to do this)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));