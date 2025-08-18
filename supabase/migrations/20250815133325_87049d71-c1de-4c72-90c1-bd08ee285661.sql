-- Enable applications by setting accept_applications to true
UPDATE public.server_settings 
SET setting_value = jsonb_set(setting_value, '{accept_applications}', 'true')
WHERE setting_key = 'application_settings';