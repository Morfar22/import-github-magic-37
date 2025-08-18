-- Drop the existing restrictive policy
DROP POLICY "Staff can view all servers" ON public.servers;

-- Create a new policy that allows everyone to view servers
CREATE POLICY "Everyone can view servers" 
ON public.servers 
FOR SELECT 
USING (true);

-- Keep the staff-only policies for create/update/delete
-- (These should already exist and don't need to be changed)