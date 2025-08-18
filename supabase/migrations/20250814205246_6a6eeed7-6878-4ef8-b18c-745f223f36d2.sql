-- Fix the handle_new_user function to handle duplicate usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Insert profile with unique username
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, final_username);
  
  -- Give user role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$function$;