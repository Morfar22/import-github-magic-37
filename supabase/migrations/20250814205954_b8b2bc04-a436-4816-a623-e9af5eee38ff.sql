-- Create foreign key relationship between user_roles and profiles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create function to get user ID by email for staff management
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM auth.users WHERE email = _email LIMIT 1;
$$;