-- Add a policy that allows staff to view all profiles
CREATE POLICY "Staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_staff(auth.uid()));