-- Remove the conflicting RESTRICTIVE policies that are blocking access
DROP POLICY IF EXISTS "applications_deny_anonymous_access" ON public.applications;
DROP POLICY IF EXISTS "applications_restrict_access" ON public.applications;