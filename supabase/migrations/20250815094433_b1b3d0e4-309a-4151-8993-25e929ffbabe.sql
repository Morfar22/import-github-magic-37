-- Create settings for homepage content
INSERT INTO server_settings (setting_key, setting_value, created_by) VALUES 
('homepage_features', '[
  {
    "title": "Professional RP Community",
    "description": "Join 300+ serious roleplayers in our whitelist-only server",
    "icon": "Users",
    "color": "text-neon-purple"
  },
  {
    "title": "Experienced Staff Team", 
    "description": "24/7 moderation ensuring fair and immersive gameplay",
    "icon": "Shield",
    "color": "text-neon-blue"
  },
  {
    "title": "Custom Content",
    "description": "Unique jobs, vehicles, and locations for endless possibilities", 
    "icon": "Map",
    "color": "text-neon-green"
  },
  {
    "title": "99.9% Uptime",
    "description": "Reliable server infrastructure for uninterrupted gameplay",
    "icon": "Clock", 
    "color": "text-yellow-400"
  }
]'::jsonb, auth.uid())
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO server_settings (setting_key, setting_value, created_by) VALUES 
('homepage_cta_section', '{
  "title": "Ready to Join the Future?",
  "description": "Our whitelist application ensures quality roleplay. Tell us about your character, your RP experience, and join hundreds of players in the most advanced FiveM server.",
  "features": [
    "Professional development team",
    "Weekly content updates", 
    "Active Discord community"
  ]
}'::jsonb, auth.uid())
ON CONFLICT (setting_key) DO NOTHING;