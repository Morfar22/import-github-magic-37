-- Grant highest staff role (admin) to the user
WITH admin_role AS (
  SELECT id FROM public.staff_roles WHERE name = 'admin' AND is_active = true LIMIT 1
)
INSERT INTO public.user_role_assignments (user_id, role_id, is_active)
SELECT 'a479d074-615a-4640-845e-8446ae84097a'::uuid, admin_role.id, true
FROM admin_role
ON CONFLICT DO NOTHING;