-- Add missing server display settings
INSERT INTO server_settings (setting_key, setting_value) VALUES 
('server_display_ip', '"connect adventure-rp.com"'),
('discord_url', '"https://discord.gg/adventure-rp"'),
('server_status', '"online"')
ON CONFLICT (setting_key) DO NOTHING;