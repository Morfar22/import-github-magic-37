-- Add foreign key relationship between applications and profiles
ALTER TABLE public.applications 
ADD CONSTRAINT applications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update application types to use correct field structure
UPDATE public.application_types 
SET form_fields = '[
  {"id": "discord_name", "label": "Discord Username", "type": "text", "required": true},
  {"id": "steam_name", "label": "Steam Name", "type": "text", "required": true}, 
  {"id": "fivem_name", "label": "FiveM Name", "type": "text", "required": true},
  {"id": "age", "label": "Age", "type": "number", "required": true},
  {"id": "character_backstory", "label": "Character Backstory", "type": "textarea", "required": true},
  {"id": "rp_experience", "label": "RP Experience", "type": "textarea", "required": true}
]'::jsonb
WHERE name = 'Whitelist Application';