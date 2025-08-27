-- Fix all RLS policy issues and create comprehensive security setup

-- Enable RLS on all tables that don't have it
ALTER TABLE public.application_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twitch_streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
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
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

-- Application Rate Limits policies
CREATE POLICY "Service can manage rate limits" ON public.application_rate_limits
  FOR ALL USING (true);

-- Application Types policies
CREATE POLICY "Anyone can view active application types" ON public.application_types
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Staff can manage application types" ON public.application_types
  FOR ALL USING (is_staff(auth.uid()));

-- Audit Logs policies
CREATE POLICY "Staff can view audit logs" ON public.audit_logs
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Chat Banned Users policies
CREATE POLICY "Staff can manage chat bans" ON public.chat_banned_users
  FOR ALL USING (is_staff(auth.uid()));

-- Chat Sessions policies
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Staff can view all chat sessions" ON public.chat_sessions
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Users can create chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  
CREATE POLICY "Staff can manage chat sessions" ON public.chat_sessions
  FOR UPDATE USING (is_staff(auth.uid()));

-- Email Templates policies
CREATE POLICY "Staff can view email templates" ON public.email_templates
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Staff can manage email templates" ON public.email_templates
  FOR ALL USING (is_staff(auth.uid()));

-- Failed Login Attempts policies
CREATE POLICY "System can manage failed login attempts" ON public.failed_login_attempts
  FOR ALL USING (true);

-- Partners policies
CREATE POLICY "Anyone can view active partners" ON public.partners
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Staff can manage partners" ON public.partners
  FOR ALL USING (is_staff(auth.uid()));

-- Permissions policies
CREATE POLICY "Staff can view permissions" ON public.permissions
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (is_admin());

-- Rules policies
CREATE POLICY "Anyone can view active rules" ON public.rules
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Staff can manage rules" ON public.rules
  FOR ALL USING (is_staff(auth.uid()));

-- Server Settings policies
CREATE POLICY "Staff can view server settings" ON public.server_settings
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Staff can manage server settings" ON public.server_settings
  FOR ALL USING (is_staff(auth.uid()));

-- Server Stats policies
CREATE POLICY "Anyone can view server stats" ON public.server_stats
  FOR SELECT USING (true);
  
CREATE POLICY "Staff can manage server stats" ON public.server_stats
  FOR ALL USING (is_staff(auth.uid()));

-- Servers policies
CREATE POLICY "Staff can view servers" ON public.servers
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Staff can manage servers" ON public.servers
  FOR ALL USING (is_staff(auth.uid()));

-- Staff Roles policies
CREATE POLICY "Staff can view staff roles" ON public.staff_roles
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Admins can manage staff roles" ON public.staff_roles
  FOR ALL USING (is_admin());

-- Team Members policies
CREATE POLICY "Anyone can view active team members" ON public.team_members
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Staff can manage team members" ON public.team_members
  FOR ALL USING (is_staff(auth.uid()));

-- Twitch Streamers policies
CREATE POLICY "Anyone can view active streamers" ON public.twitch_streamers
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Staff can manage streamers" ON public.twitch_streamers
  FOR ALL USING (is_staff(auth.uid()));

-- User Role Assignments policies
CREATE POLICY "Staff can view role assignments" ON public.user_role_assignments
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Admins can manage role assignments" ON public.user_role_assignments
  FOR ALL USING (is_admin());

-- User Roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Staff can view all user roles" ON public.user_roles
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "System can assign default roles" ON public.user_roles
  FOR INSERT WITH CHECK (role = 'user');
  
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (is_admin());

-- User Sessions policies
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY "System can manage sessions" ON public.user_sessions
  FOR ALL USING (true);

-- Add triggers for updated_at timestamps where missing
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables that have updated_at columns
CREATE TRIGGER handle_updated_at_application_types
  BEFORE UPDATE ON public.application_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_partners
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_rules
  BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_server_settings
  BEFORE UPDATE ON public.server_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_server_stats
  BEFORE UPDATE ON public.server_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_servers
  BEFORE UPDATE ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_staff_roles
  BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_team_members
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_twitch_streamers
  BEFORE UPDATE ON public.twitch_streamers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Ensure profiles table has the user creation trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();