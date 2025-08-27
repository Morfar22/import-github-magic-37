-- Complete backend security setup - handle existing objects

-- Drop and recreate triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_application_types_updated_at ON public.application_types;
DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
DROP TRIGGER IF EXISTS update_rules_updated_at ON public.rules;
DROP TRIGGER IF EXISTS update_server_settings_updated_at ON public.server_settings;
DROP TRIGGER IF EXISTS update_server_stats_updated_at ON public.server_stats;
DROP TRIGGER IF EXISTS update_servers_updated_at ON public.servers;
DROP TRIGGER IF EXISTS update_staff_roles_updated_at ON public.staff_roles;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
DROP TRIGGER IF EXISTS update_twitch_streamers_updated_at ON public.twitch_streamers;

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_type_id uuid REFERENCES public.application_types(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  form_data jsonb NOT NULL DEFAULT '{}',
  notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on applications table
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing application policies if they exist
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their pending applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Staff can manage applications" ON public.applications;

-- Create application policies
CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can create their own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their pending applications" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
  
CREATE POLICY "Staff can view all applications" ON public.applications
  FOR SELECT USING (is_staff(auth.uid()));
  
CREATE POLICY "Staff can manage applications" ON public.applications
  FOR ALL USING (is_staff(auth.uid()));

-- Create all updated_at triggers
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_types_updated_at
  BEFORE UPDATE ON public.application_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rules_updated_at
  BEFORE UPDATE ON public.rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_server_settings_updated_at
  BEFORE UPDATE ON public.server_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_server_stats_updated_at
  BEFORE UPDATE ON public.server_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_roles_updated_at
  BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_twitch_streamers_updated_at
  BEFORE UPDATE ON public.twitch_streamers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(application_type_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Insert sample data only if tables are empty
INSERT INTO public.application_types (name, description, form_fields, is_active)
SELECT 
  'General Application',
  'General purpose application form',
  '[
    {"name": "full_name", "type": "text", "label": "Full Name", "required": true},
    {"name": "age", "type": "number", "label": "Age", "required": true},
    {"name": "experience", "type": "textarea", "label": "Previous Experience", "required": false},
    {"name": "why_join", "type": "textarea", "label": "Why do you want to join?", "required": true}
  ]'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.application_types LIMIT 1);

-- Insert default staff roles
INSERT INTO public.staff_roles (name, display_name, description, hierarchy_level, color) VALUES
  ('admin', 'Administrator', 'Full system access', 100, '#dc2626'),
  ('moderator', 'Moderator', 'Content and user moderation', 50, '#f59e0b'),
  ('support', 'Support Staff', 'Customer support and basic moderation', 25, '#3b82f6')
ON CONFLICT (name) DO NOTHING;

-- Insert sample server if none exists
INSERT INTO public.servers (name, ip_address, port, is_active)
SELECT 'Main Server', '127.0.0.1', 30120, true
WHERE NOT EXISTS (SELECT 1 FROM public.servers LIMIT 1);

-- Initialize server stats if none exist
INSERT INTO public.server_stats (players_online, max_players, queue_count, server_online, uptime_percentage, ping_ms)
SELECT 0, 300, 0, true, 99.9, 15
WHERE NOT EXISTS (SELECT 1 FROM public.server_stats LIMIT 1);