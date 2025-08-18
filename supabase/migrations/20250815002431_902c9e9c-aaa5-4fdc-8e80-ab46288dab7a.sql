-- Additional security hardening: Add explicit restrictive policies to prevent any potential unauthorized access

-- For profiles table: Add restrictive policy to explicitly deny anonymous access
CREATE POLICY "profiles_deny_anonymous_access" 
ON public.profiles 
AS RESTRICTIVE 
FOR ALL 
TO public
USING (auth.uid() IS NOT NULL);

-- For applications table: Add restrictive policy to explicitly deny anonymous access  
CREATE POLICY "applications_deny_anonymous_access"
ON public.applications
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- For application_actions table: Add restrictive policy to explicitly deny anonymous access
CREATE POLICY "application_actions_deny_anonymous_access"
ON public.application_actions  
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Additional profile protection: Ensure sensitive fields are only accessible to authorized users
CREATE POLICY "profiles_restrict_sensitive_data"
ON public.profiles
AS RESTRICTIVE  
FOR SELECT
TO public
USING (
  auth.uid() = id OR is_staff(auth.uid())
);

-- Additional application protection: Ensure applications are only accessible to applicant or staff
CREATE POLICY "applications_restrict_access"
ON public.applications
AS RESTRICTIVE
FOR SELECT  
TO public
USING (
  auth.uid() = user_id OR is_staff(auth.uid())
);

-- Additional application actions protection: Ensure only staff can access
CREATE POLICY "application_actions_staff_only"
ON public.application_actions
AS RESTRICTIVE
FOR SELECT
TO public  
USING (is_staff(auth.uid()));