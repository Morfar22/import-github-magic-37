-- Update the is_staff function to check both legacy and new role systems
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Check legacy user_roles table
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'moderator')
  )
  OR
  -- Check new user_role_assignments table
  EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = _user_id
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND sr.is_active = true
  )
$function$;

-- Update the has_role function to check both systems
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Check legacy user_roles table
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
  OR
  -- Check new user_role_assignments table for admin role
  (_role = 'admin' AND EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = _user_id
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND sr.is_active = true
      AND sr.hierarchy_level >= 80  -- Admin level hierarchy
  ))
  OR
  -- Check new user_role_assignments table for moderator role
  (_role = 'moderator' AND EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = _user_id
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND sr.is_active = true
      AND sr.hierarchy_level >= 60  -- Moderator level hierarchy
  ))
$function$;