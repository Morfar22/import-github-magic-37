-- Update Google AdSense publisher ID with actual value
UPDATE server_settings 
SET setting_value = '"ca-pub-5997426263268867"', updated_at = now()
WHERE setting_key = 'google_adsense_publisher_id';