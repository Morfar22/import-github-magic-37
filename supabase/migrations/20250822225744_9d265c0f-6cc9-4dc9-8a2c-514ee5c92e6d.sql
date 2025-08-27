-- Add admin role for the user
INSERT INTO public.user_roles (user_id, role)
VALUES ('a479d074-615a-4640-845e-8446ae84097a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;