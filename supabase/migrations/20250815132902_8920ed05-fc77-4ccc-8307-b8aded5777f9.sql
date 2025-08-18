-- Update application types to use correct field structure with proper IDs
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

-- Ensure the application type is active
UPDATE public.application_types 
SET is_active = true
WHERE name = 'Whitelist Application';