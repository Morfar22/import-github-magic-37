-- Fix all RLS policy issues and create comprehensive security setup (final)

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger properly
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create missing application table with proper security
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

-- Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Applications policies
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

-- Add trigger for applications updated_at using existing function
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at triggers to tables that have updated_at columns using existing function
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_type ON public.applications(application_type_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON public.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Insert default application type if none exist
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
WHERE NOT EXISTS (SELECT 1 FROM public.application_types);

-- Insert default permissions
INSERT INTO public.permissions (name, display_name, description, category) VALUES
  ('manage_users', 'Manage Users', 'Can manage user accounts and profiles', 'user_management'),
  ('manage_applications', 'Manage Applications', 'Can review and manage applications', 'applications'),
  ('manage_server', 'Manage Server', 'Can manage server settings and configuration', 'server_management'),
  ('manage_content', 'Manage Content', 'Can manage rules, partners, and content', 'content_management'),
  ('view_analytics', 'View Analytics', 'Can view server statistics and analytics', 'analytics'),
  ('manage_staff', 'Manage Staff', 'Can manage staff roles and assignments', 'staff_management')
ON CONFLICT (name) DO NOTHING;