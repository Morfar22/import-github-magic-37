-- Add foreign key relationship between user_roles and profiles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Check if we have any profiles data - if not, we need to create the profile trigger
-- First, let's see if the trigger exists
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If no trigger exists, create it to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    CONCAT(
      COALESCE(new.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(new.raw_user_meta_data->>'last_name', '')
    )
  );
  RETURN new;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create profile for existing user (the current user)
INSERT INTO public.profiles (id, username, full_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)) as username,
  CONCAT(
    COALESCE(raw_user_meta_data->>'first_name', ''),
    ' ',
    COALESCE(raw_user_meta_data->>'last_name', '')
  ) as full_name
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Add the user as admin (replace with actual user ID when we know it)
-- For now, we'll add the role for any authenticated user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- Make sure rules data exists - if empty, re-insert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rules LIMIT 1) THEN
    INSERT INTO public.rules (category, title, description, order_index) VALUES
    ('General Rules', 'Respect All Players', 'Be respectful to all players and staff members', 1),
    ('General Rules', 'No Metagaming', 'No metagaming, powergaming, or fail RP', 2),
    ('General Rules', 'Stay In Character', 'Stay in character at all times while in city', 3),
    ('Roleplay Rules', 'Realistic Characters', 'Create realistic and believable characters', 1),
    ('Roleplay Rules', 'Fear for Life', 'Fear for your character''s life in dangerous situations', 2),
    ('Crime & Police', 'Group Limit', 'Maximum 4 players per criminal group', 1),
    ('Crime & Police', 'Probable Cause', 'Police must have probable cause for searches', 2),
    ('EMS & Medical', 'Allow EMS Work', 'Allow EMS to do their job without interference', 1),
    ('EMS & Medical', 'No Combat Logging', 'No combat logging to avoid medical RP', 2);
  END IF;
END $$;