-- Insert Google AdSense publisher ID setting
INSERT INTO server_settings (setting_key, setting_value, created_by)
VALUES ('google_adsense_publisher_id', '"ca-pub-XXXXXXXXXX"', auth.uid())
ON CONFLICT (setting_key) DO NOTHING;