-- Insert missing default settings if they don't exist
INSERT INTO server_settings (setting_key, setting_value, created_by)
SELECT 'discord_settings', '{"server_id": "", "bot_token": "", "client_id": "", "client_secret": ""}', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM server_settings WHERE setting_key = 'discord_settings'
);

INSERT INTO server_settings (setting_key, setting_value, created_by)  
SELECT 'security_settings', '{"rate_limit_enabled": true, "max_login_attempts": 5, "lockout_duration": 15, "ip_whitelist_enabled": false}', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM server_settings WHERE setting_key = 'security_settings'
);

INSERT INTO server_settings (setting_key, setting_value, created_by)
SELECT 'discord_logging_settings', '{"staff_webhook": "", "security_webhook": "", "general_webhook": "", "errors_webhook": ""}', NULL  
WHERE NOT EXISTS (
  SELECT 1 FROM server_settings WHERE setting_key = 'discord_logging_settings'
);

-- Ensure general_settings has maintenance_mode flag
UPDATE server_settings 
SET setting_value = setting_value || '{"maintenance_mode": false}'
WHERE setting_key = 'general_settings' 
  AND NOT (setting_value ? 'maintenance_mode');