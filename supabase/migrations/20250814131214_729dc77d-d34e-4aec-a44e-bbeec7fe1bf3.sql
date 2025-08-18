-- Give your user admin role to test the staff panel
INSERT INTO public.user_roles (user_id, role) 
VALUES ('0ee66fdd-1ec6-4d72-a0c7-57e687fd796c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;