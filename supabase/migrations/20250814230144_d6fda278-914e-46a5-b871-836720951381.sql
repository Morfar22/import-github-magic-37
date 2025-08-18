-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email text;

-- Create index for better performance when searching by email
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Update the handle_new_user function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_username text;
  final_username text;
  username_counter integer := 1;
BEGIN
  -- Get base username from metadata or email
  base_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  final_username := base_username;
  
  -- Check if username exists and generate a unique one
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || '_' || username_counter;
    username_counter := username_counter + 1;
  END LOOP;
  
  -- Insert profile with unique username and email
  INSERT INTO public.profiles (id, username, email)
  VALUES (new.id, final_username, new.email);
  
  -- Give user role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;