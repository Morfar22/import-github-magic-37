-- Ensure default navbar_config exists with sensible defaults
INSERT INTO server_settings (setting_key, setting_value, created_by)
SELECT 'navbar_config',
       '{
         "items": [
           {"id":"home","label":"Home","path":"/","visible":true,"order":0,"staffOnly":false},
           {"id":"apply","label":"Apply","path":"/apply","visible":true,"order":1,"staffOnly":false},
           {"id":"rules","label":"Rules","path":"/rules","visible":true,"order":2,"staffOnly":false},
           {"id":"team","label":"Our Team","path":"/team","visible":true,"order":3,"staffOnly":false},
           {"id":"partners","label":"Partners","path":"/partners","visible":true,"order":4,"staffOnly":false},
           {"id":"live","label":"Live","path":"/live","visible":true,"order":5,"staffOnly":false},
           {"id":"staff","label":"Staff Panel","path":"/staff","visible":true,"order":6,"staffOnly":true},
           {"id":"servers","label":"Servers","path":"/servers","visible":true,"order":7,"staffOnly":true},
           {"id":"users","label":"Users","path":"/users","visible":true,"order":8,"staffOnly":true}
         ]
       }'::jsonb,
       NULL
WHERE NOT EXISTS (
  SELECT 1 FROM server_settings WHERE setting_key = 'navbar_config'
);
