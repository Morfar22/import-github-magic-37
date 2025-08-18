-- Allow public read access to navbar_config setting
CREATE POLICY "Public can view navbar config"
ON public.server_settings
FOR SELECT
TO public
USING (setting_key = 'navbar_config');