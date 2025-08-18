-- Drop existing problematic policies that might be conflicting
DROP POLICY IF EXISTS "applications_restrict_access" ON public.applications;
DROP POLICY IF EXISTS "applications_deny_anonymous_access" ON public.applications;

-- Create simple, clear RLS policies for applications
CREATE POLICY "Staff can view all applications" 
ON public.applications 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can update all applications" 
ON public.applications 
FOR UPDATE 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete all applications" 
ON public.applications 
FOR DELETE 
USING (is_staff(auth.uid()));

CREATE POLICY "Users can view their own applications" 
ON public.applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure authenticated users only
CREATE POLICY "applications_require_auth" 
ON public.applications 
FOR ALL 
USING (auth.uid() IS NOT NULL);