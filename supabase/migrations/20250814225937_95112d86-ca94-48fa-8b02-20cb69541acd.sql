-- Add a banned field to the profiles table
ALTER TABLE public.profiles ADD COLUMN banned BOOLEAN NOT NULL DEFAULT false;

-- Add a banned_at timestamp field to track when user was banned
ALTER TABLE public.profiles ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE;

-- Add a banned_by field to track which staff member banned the user
ALTER TABLE public.profiles ADD COLUMN banned_by UUID REFERENCES auth.users(id);

-- Create a policy to allow staff to update ban status
CREATE POLICY "Staff can update user ban status" 
ON public.profiles 
FOR UPDATE 
USING (is_staff(auth.uid()));

-- Create a policy to allow staff to delete profiles
CREATE POLICY "Staff can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_staff(auth.uid()));