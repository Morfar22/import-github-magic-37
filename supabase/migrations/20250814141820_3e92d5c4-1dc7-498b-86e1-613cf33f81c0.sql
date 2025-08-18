-- Create application types table
CREATE TABLE public.application_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  form_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.application_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active application types" 
ON public.application_types 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage application types" 
ON public.application_types 
FOR ALL 
USING (is_staff(auth.uid()));

-- Add application_type_id to applications table
ALTER TABLE public.applications 
ADD COLUMN application_type_id uuid REFERENCES public.application_types(id);

-- Create trigger for updated_at
CREATE TRIGGER update_application_types_updated_at
BEFORE UPDATE ON public.application_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default application type for existing data
INSERT INTO public.application_types (name, description, form_fields) 
VALUES (
  'Whitelist Application',
  'Standard server whitelist application',
  '[
    {"name": "steam_name", "label": "Steam Name", "type": "text", "required": true},
    {"name": "discord_tag", "label": "Discord Tag", "type": "text", "required": true},
    {"name": "discord_name", "label": "Discord User ID", "type": "text", "required": true},
    {"name": "fivem_name", "label": "FiveM Name", "type": "text", "required": true},
    {"name": "age", "label": "Age", "type": "number", "required": true},
    {"name": "rp_experience", "label": "RP Experience", "type": "textarea", "required": true},
    {"name": "character_backstory", "label": "Character Backstory", "type": "textarea", "required": true}
  ]'::jsonb
);

-- Update existing applications to use the default type
UPDATE public.applications 
SET application_type_id = (
  SELECT id FROM public.application_types 
  WHERE name = 'Whitelist Application' 
  LIMIT 1
);

-- Make application_type_id required now that we have data
ALTER TABLE public.applications 
ALTER COLUMN application_type_id SET NOT NULL;