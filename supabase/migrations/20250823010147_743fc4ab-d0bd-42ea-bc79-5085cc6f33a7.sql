-- Update RLS policies for servers table to make server status globally visible
-- while keeping management restricted to staff

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Staff can view servers" ON public.servers;
DROP POLICY IF EXISTS "Staff can manage servers" ON public.servers;

-- Create new policies that allow everyone to view servers but only staff to manage them
CREATE POLICY "Anyone can view active servers"
ON public.servers
FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff can view all servers"
ON public.servers
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage servers"
ON public.servers
FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Also update server_stats table to be globally visible
DROP POLICY IF EXISTS "Anyone can view server stats" ON public.server_stats;
DROP POLICY IF EXISTS "Staff can manage server stats" ON public.server_stats;

CREATE POLICY "Anyone can view server stats"
ON public.server_stats
FOR SELECT
USING (true);

CREATE POLICY "Staff can manage server stats"
ON public.server_stats
FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Update individual_server_stats table to be globally visible
DROP POLICY IF EXISTS "Anyone can view individual server stats" ON public.individual_server_stats;
DROP POLICY IF EXISTS "Staff can manage individual server stats" ON public.individual_server_stats;

CREATE POLICY "Anyone can view individual server stats"
ON public.individual_server_stats
FOR SELECT
USING (true);

CREATE POLICY "Staff can manage individual server stats"
ON public.individual_server_stats
FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));