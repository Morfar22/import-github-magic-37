-- Create a settings table for server configuration
CREATE TABLE public.server_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.server_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view settings" 
ON public.server_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage settings" 
ON public.server_settings 
FOR ALL 
USING (is_staff(auth.uid()));

-- Insert default settings
INSERT INTO public.server_settings (setting_key, setting_value) VALUES
('general_settings', '{
  "server_name": "Dreamlight RP Server",
  "max_players": 64,
  "application_cooldown_days": 0
}'::jsonb),
('application_settings', '{
  "auto_approve": false,
  "email_notifications": true,
  "discord_integration": false,
  "multiple_applications_allowed": true
}'::jsonb),
('discord_settings', '{
  "webhook_url": "",
  "enabled": false
}'::jsonb);

-- Add trigger for updated_at
CREATE TRIGGER update_server_settings_updated_at
BEFORE UPDATE ON public.server_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();