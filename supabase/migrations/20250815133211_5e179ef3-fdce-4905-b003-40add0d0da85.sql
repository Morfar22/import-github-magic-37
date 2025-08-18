-- Update navbar config to remove users link since it's now under staff panel
UPDATE public.server_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{items}',
  (
    SELECT jsonb_agg(item)
    FROM jsonb_array_elements(setting_value->'items') AS item
    WHERE item->>'id' != 'users'
  )
)
WHERE setting_key = 'navbar_config';