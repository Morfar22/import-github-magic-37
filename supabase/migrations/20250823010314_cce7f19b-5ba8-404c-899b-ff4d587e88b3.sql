-- Fix missing profile and role for user Emil2
-- The handle_new_user() trigger seems to have failed for this user

-- Insert missing profile for Emil2
INSERT INTO public.profiles (id, username, email, created_at, updated_at)
VALUES (
  '3b87ceaf-6fc1-43d1-8f9d-d8a5295b3f38',
  'Emil2',
  'emilfrobergww@gmail.com',
  now(),
  now()
);

-- Insert missing user role for Emil2
INSERT INTO public.user_roles (user_id, role)
VALUES ('3b87ceaf-6fc1-43d1-8f9d-d8a5295b3f38', 'user');

-- Also add staff role assignment for Emil2 so they can manage servers too
INSERT INTO public.user_role_assignments (user_id, role_id, assigned_by, is_active)
SELECT 
  '3b87ceaf-6fc1-43d1-8f9d-d8a5295b3f38',
  sr.id,
  'a479d074-615a-4640-845e-8446ae84097a', -- assigned by Mmorfar
  true
FROM staff_roles sr 
WHERE sr.name = 'admin'
LIMIT 1;