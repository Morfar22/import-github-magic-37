-- Create role_permissions table for the role management system
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create individual_server_stats table for detailed server analytics
CREATE TABLE public.individual_server_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  players_online INTEGER NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 300,
  queue_count INTEGER NOT NULL DEFAULT 0,
  server_online BOOLEAN NOT NULL DEFAULT true,
  ping_ms INTEGER NOT NULL DEFAULT 15,
  uptime_percentage NUMERIC NOT NULL DEFAULT 99.9,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_server_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for role_permissions
CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (is_admin());

CREATE POLICY "Staff can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (is_staff(auth.uid()));

-- RLS policies for individual_server_stats
CREATE POLICY "Staff can manage individual server stats" 
ON public.individual_server_stats 
FOR ALL 
USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can view individual server stats" 
ON public.individual_server_stats 
FOR SELECT 
USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_individual_server_stats_updated_at
  BEFORE UPDATE ON public.individual_server_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_individual_server_stats_server_id ON public.individual_server_stats(server_id);
CREATE INDEX idx_individual_server_stats_recorded_at ON public.individual_server_stats(recorded_at);

-- Insert sample permissions data
INSERT INTO public.permissions (name, display_name, category, description) VALUES
('manage_applications', 'Manage Applications', 'Applications', 'Can approve, deny, and manage applications'),
('manage_users', 'Manage Users', 'Users', 'Can ban, unban, and manage user accounts'),
('manage_servers', 'Manage Servers', 'Servers', 'Can manage server settings and configurations'),
('view_analytics', 'View Analytics', 'Analytics', 'Can view server analytics and reports'),
('manage_roles', 'Manage Roles', 'Administration', 'Can manage user roles and permissions')
ON CONFLICT (name) DO NOTHING;