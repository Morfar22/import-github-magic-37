-- Create profile for existing user if it doesn't exist
INSERT INTO public.profiles (id, username, full_name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username,
  TRIM(CONCAT(
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    ' ',
    COALESCE(au.raw_user_meta_data->>'last_name', '')
  )) as full_name
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Add admin role for existing users if they don't have any roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE p.id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-insert rules data if table is empty
INSERT INTO public.rules (category, title, description, order_index)
SELECT * FROM (VALUES
  ('General Rules', 'Respect All Players', 'Be respectful to all players and staff members', 1),
  ('General Rules', 'No Metagaming', 'No metagaming, powergaming, or fail RP', 2),
  ('General Rules', 'Stay In Character', 'Stay in character at all times while in city', 3),
  ('General Rules', 'Use OOC Sparingly', 'Use /ooc sparingly and only when necessary', 4),
  ('General Rules', 'No RDM/VDM', 'No random deathmatch (RDM) or vehicle deathmatch (VDM)', 5),
  ('Roleplay Rules', 'Realistic Characters', 'Create realistic and believable characters', 1),
  ('Roleplay Rules', 'Fear for Life', 'Fear for your character''s life in dangerous situations', 2),
  ('Roleplay Rules', 'No Superhuman Abilities', 'No unrealistic stunts or superhuman abilities', 3),
  ('Crime & Police', 'Group Limit', 'Maximum 4 players per criminal group', 1),
  ('Crime & Police', 'Probable Cause', 'Police must have probable cause for searches', 2),
  ('EMS & Medical', 'Allow EMS Work', 'Allow EMS to do their job without interference', 1),
  ('EMS & Medical', 'No Combat Logging', 'No combat logging to avoid medical RP', 2)
) AS rules_data(category, title, description, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.rules LIMIT 1);