-- Add foreign key constraint between supporters.user_id and profiles.id
ALTER TABLE public.supporters 
ADD CONSTRAINT supporters_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;