-- Enable applications by setting accept_applications to true
UPDATE public.server_settings 
SET setting_value = '{"accept_applications": true}'::jsonb
WHERE setting_key = 'application_settings';

-- Make sure the whitelist application type is active
UPDATE public.application_types 
SET is_active = true
WHERE name = 'Whitelist Application';