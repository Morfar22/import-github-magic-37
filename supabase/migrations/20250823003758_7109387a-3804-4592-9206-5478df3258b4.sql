-- Fix the is_staff function (drop and recreate to change parameter signature)
DROP FUNCTION IF EXISTS public.is_staff(uuid);

-- Recreate is_staff function with correct signature
CREATE OR REPLACE FUNCTION public.is_staff(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has any staff role (admin, moderator, etc.)
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role IN ('admin', 'moderator', 'staff')
    UNION
    SELECT 1 FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = user_uuid 
    AND ura.is_active = true
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  );
END;
$$;

-- Update is_admin function to check both tables
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has admin role in user_roles or user_role_assignments
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
    UNION
    SELECT 1 FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = auth.uid() 
    AND ura.is_active = true
    AND sr.name = 'admin'
    AND (ura.expires_at IS NULL OR ura.expires_at > now())
  );
END;
$$;

-- Grant current user admin role so they can create roles
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin')
ON CONFLICT (user_id, role) DO NOTHING;