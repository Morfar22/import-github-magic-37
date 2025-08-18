-- Backfill emails for existing users from auth.users table
UPDATE public.profiles 
SET email = auth_users.email
FROM (
  SELECT id, email 
  FROM auth.users
) AS auth_users
WHERE profiles.id = auth_users.id 
  AND profiles.email IS NULL;