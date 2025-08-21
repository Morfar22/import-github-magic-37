-- Create custom roles table to replace the enum system
CREATE TABLE public.staff_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  hierarchy_level integer NOT NULL DEFAULT 0, -- Higher number = more authority
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create permissions table
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create role permissions junction table
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id uuid NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  permission_name text NOT NULL REFERENCES public.permissions(name) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE(role_id, permission_name)
);

-- Create new user role assignments table
CREATE TABLE public.user_role_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff_roles
CREATE POLICY "Staff can view all roles" ON public.staff_roles
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.staff_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for permissions
CREATE POLICY "Staff can view permissions" ON public.permissions
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for role_permissions
CREATE POLICY "Staff can view role permissions" ON public.role_permissions
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create RLS policies for user_role_assignments
CREATE POLICY "Staff can view role assignments" ON public.user_role_assignments
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Users can view their own assignments" ON public.user_role_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage role assignments" ON public.user_role_assignments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default staff roles
INSERT INTO public.staff_roles (name, display_name, description, color, hierarchy_level) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', '#dc2626', 100),
('admin', 'Administrator', 'High-level administrative access', '#7c3aed', 80),
('moderator', 'Moderator', 'Standard moderation capabilities', '#2563eb', 60),
('helper', 'Helper', 'Basic support and assistance role', '#059669', 40),
('trainee', 'Trainee', 'Training role with limited permissions', '#ea580c', 20);

-- Insert comprehensive permissions for all staff panel features
INSERT INTO public.permissions (name, display_name, description, category) VALUES
-- Dashboard permissions
('view_dashboard', 'View Dashboard', 'Access to staff dashboard overview', 'dashboard'),
('view_analytics', 'View Analytics', 'Access to detailed analytics and metrics', 'dashboard'),

-- Application permissions
('view_applications', 'View Applications', 'View submitted applications', 'applications'),
('manage_applications', 'Manage Applications', 'Review, approve, and deny applications', 'applications'),
('delete_applications', 'Delete Applications', 'Permanently delete applications', 'applications'),
('manage_application_types', 'Manage Application Types', 'Create and modify application types and forms', 'applications'),

-- User management permissions
('view_users', 'View Users', 'View user profiles and information', 'users'),
('manage_users', 'Manage Users', 'Edit user profiles and basic information', 'users'),
('ban_users', 'Ban Users', 'Ban and unban user accounts', 'users'),
('delete_users', 'Delete Users', 'Permanently delete user accounts', 'users'),

-- Staff management permissions
('view_staff', 'View Staff', 'View staff members and roles', 'staff'),
('manage_staff_roles', 'Manage Staff Roles', 'Assign and remove staff roles from users', 'staff'),
('manage_role_system', 'Manage Role System', 'Create, edit, and delete staff roles and permissions', 'staff'),

-- Content management permissions
('manage_rules', 'Manage Rules', 'Create, edit, and delete server rules', 'content'),
('manage_homepage', 'Manage Homepage', 'Edit homepage content and layout', 'content'),
('manage_team_page', 'Manage Team Page', 'Manage team member profiles and information', 'content'),
('manage_partners', 'Manage Partners', 'Manage partner listings and information', 'content'),
('manage_navigation', 'Manage Navigation', 'Configure website navigation and menus', 'content'),

-- System permissions
('manage_server_stats', 'Manage Server Stats', 'Configure and manage server statistics', 'system'),
('manage_email_templates', 'Manage Email Templates', 'Create and edit email templates', 'system'),
('view_system_logs', 'View System Logs', 'Access system logs and audit trails', 'system'),
('manage_security', 'Manage Security', 'Configure security settings and monitoring', 'system'),
('manage_deployment', 'Manage Deployment', 'Access deployment and infrastructure settings', 'system'),
('manage_system_settings', 'Manage System Settings', 'Configure core system settings', 'system'),

-- Discord and integrations
('manage_discord', 'Manage Discord Integration', 'Configure Discord bot and logging settings', 'integrations'),
('manage_twitch', 'Manage Twitch Integration', 'Configure Twitch streamers and integration', 'integrations'),

-- Advanced permissions
('manage_ip_whitelist', 'Manage IP Whitelist', 'Configure IP access controls', 'security'),
('view_audit_logs', 'View Audit Logs', 'Access detailed audit and security logs', 'security'),
('system_administration', 'System Administration', 'Full system administration access', 'system');

-- Assign permissions to roles
-- Super Admin gets everything
INSERT INTO public.role_permissions (role_id, permission_name)
SELECT sr.id, p.name 
FROM public.staff_roles sr, public.permissions p 
WHERE sr.name = 'super_admin';

-- Admin gets most permissions except system administration
INSERT INTO public.role_permissions (role_id, permission_name)
SELECT sr.id, p.name 
FROM public.staff_roles sr, public.permissions p 
WHERE sr.name = 'admin' AND p.name != 'system_administration';

-- Moderator gets basic moderation permissions
INSERT INTO public.role_permissions (role_id, permission_name)
SELECT sr.id, p.name 
FROM public.staff_roles sr, public.permissions p 
WHERE sr.name = 'moderator' AND p.name IN (
  'view_dashboard', 'view_applications', 'manage_applications', 'view_users', 'manage_users', 
  'ban_users', 'view_staff', 'manage_rules', 'view_system_logs', 'manage_discord'
);

-- Helper gets support-focused permissions
INSERT INTO public.role_permissions (role_id, permission_name)
SELECT sr.id, p.name 
FROM public.staff_roles sr, public.permissions p 
WHERE sr.name = 'helper' AND p.name IN (
  'view_dashboard', 'view_applications', 'view_users', 'view_staff', 'view_system_logs'
);

-- Trainee gets minimal permissions
INSERT INTO public.role_permissions (role_id, permission_name)
SELECT sr.id, p.name 
FROM public.staff_roles sr, public.permissions p 
WHERE sr.name = 'trainee' AND p.name IN (
  'view_dashboard', 'view_applications', 'view_users'
);

-- Create functions for permission checking
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.role_permissions rp ON ura.role_id = rp.role_id
    WHERE ura.user_id = _user_id
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND rp.permission_name = _permission
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    WHERE ura.user_id = _user_id
      AND ura.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
  )
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_staff_roles_updated_at
  BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();