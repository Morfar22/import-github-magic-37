-- Add all missing RLS policies to complete security setup

-- Application Rate Limits policies
DROP POLICY IF EXISTS "Service can manage rate limits" ON public.application_rate_limits;
CREATE POLICY "Service can manage rate limits" ON public.application_rate_limits
  FOR ALL USING (true);

-- Application Types policies  
DROP POLICY IF EXISTS "Anyone can view active application types" ON public.application_types;
DROP POLICY IF EXISTS "Staff can manage application types" ON public.application_types;
CREATE POLICY "Anyone can view active application types" ON public.application_types
  FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage application types" ON public.application_types
  FOR ALL USING (is_staff(auth.uid()));

-- Audit Logs policies
DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Staff can view audit logs" ON public.audit_logs
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Chat Banned Users policies
DROP POLICY IF EXISTS "Staff can manage chat bans" ON public.chat_banned_users;
CREATE POLICY "Staff can manage chat bans" ON public.chat_banned_users
  FOR ALL USING (is_staff(auth.uid()));

-- Chat Sessions policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Staff can view all chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Staff can manage chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all chat sessions" ON public.chat_sessions
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Users can create chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Staff can manage chat sessions" ON public.chat_sessions
  FOR UPDATE USING (is_staff(auth.uid()));

-- Email Templates policies
DROP POLICY IF EXISTS "Staff can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Staff can manage email templates" ON public.email_templates;
CREATE POLICY "Staff can view email templates" ON public.email_templates
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage email templates" ON public.email_templates
  FOR ALL USING (is_staff(auth.uid()));

-- Failed Login Attempts policies
DROP POLICY IF EXISTS "System can manage failed login attempts" ON public.failed_login_attempts;
CREATE POLICY "System can manage failed login attempts" ON public.failed_login_attempts
  FOR ALL USING (true);

-- Partners policies
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partners;
DROP POLICY IF EXISTS "Staff can manage partners" ON public.partners;
CREATE POLICY "Anyone can view active partners" ON public.partners
  FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage partners" ON public.partners
  FOR ALL USING (is_staff(auth.uid()));

-- Permissions policies
DROP POLICY IF EXISTS "Staff can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Staff can view permissions" ON public.permissions
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (is_admin());

-- Rules policies
DROP POLICY IF EXISTS "Anyone can view active rules" ON public.rules;
DROP POLICY IF EXISTS "Staff can manage rules" ON public.rules;
CREATE POLICY "Anyone can view active rules" ON public.rules
  FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage rules" ON public.rules
  FOR ALL USING (is_staff(auth.uid()));

-- Server Settings policies
DROP POLICY IF EXISTS "Staff can view server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Staff can manage server settings" ON public.server_settings;
CREATE POLICY "Staff can view server settings" ON public.server_settings
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage server settings" ON public.server_settings
  FOR ALL USING (is_staff(auth.uid()));

-- Server Stats policies
DROP POLICY IF EXISTS "Anyone can view server stats" ON public.server_stats;
DROP POLICY IF EXISTS "Staff can manage server stats" ON public.server_stats;
CREATE POLICY "Anyone can view server stats" ON public.server_stats
  FOR SELECT USING (true);
CREATE POLICY "Staff can manage server stats" ON public.server_stats
  FOR ALL USING (is_staff(auth.uid()));

-- Servers policies
DROP POLICY IF EXISTS "Staff can view servers" ON public.servers;
DROP POLICY IF EXISTS "Staff can manage servers" ON public.servers;
CREATE POLICY "Staff can view servers" ON public.servers
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can manage servers" ON public.servers
  FOR ALL USING (is_staff(auth.uid()));

-- Staff Roles policies
DROP POLICY IF EXISTS "Staff can view staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Admins can manage staff roles" ON public.staff_roles;
CREATE POLICY "Staff can view staff roles" ON public.staff_roles
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage staff roles" ON public.staff_roles
  FOR ALL USING (is_admin());

-- Team Members policies
DROP POLICY IF EXISTS "Anyone can view active team members" ON public.team_members;
DROP POLICY IF EXISTS "Staff can manage team members" ON public.team_members;
CREATE POLICY "Anyone can view active team members" ON public.team_members
  FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage team members" ON public.team_members
  FOR ALL USING (is_staff(auth.uid()));

-- Twitch Streamers policies
DROP POLICY IF EXISTS "Anyone can view active streamers" ON public.twitch_streamers;
DROP POLICY IF EXISTS "Staff can manage streamers" ON public.twitch_streamers;
CREATE POLICY "Anyone can view active streamers" ON public.twitch_streamers
  FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage streamers" ON public.twitch_streamers
  FOR ALL USING (is_staff(auth.uid()));

-- User Role Assignments policies
DROP POLICY IF EXISTS "Staff can view role assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments" ON public.user_role_assignments;
CREATE POLICY "Staff can view role assignments" ON public.user_role_assignments
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage role assignments" ON public.user_role_assignments
  FOR ALL USING (is_admin());

-- User Roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Staff can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can assign default roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all user roles" ON public.user_roles
  FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "System can assign default roles" ON public.user_roles
  FOR INSERT WITH CHECK (role = 'user');
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (is_admin());

-- User Sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "System can manage sessions" ON public.user_sessions
  FOR ALL USING (true);

-- Fix security definer functions with proper search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_above()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

-- Fix existing functions with proper search path
ALTER FUNCTION public.is_staff(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;