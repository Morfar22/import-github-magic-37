-- Create server_stats table for real-time server information
CREATE TABLE public.server_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  players_online INTEGER NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 300,
  queue_count INTEGER NOT NULL DEFAULT 0,
  uptime_percentage DECIMAL(5,2) NOT NULL DEFAULT 99.9,
  ping_ms INTEGER NOT NULL DEFAULT 15,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.server_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read server stats
CREATE POLICY "Everyone can view server stats" 
ON public.server_stats 
FOR SELECT 
USING (true);

-- Only staff can update server stats
CREATE POLICY "Staff can manage server stats" 
ON public.server_stats 
FOR ALL 
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_server_stats_updated_at
BEFORE UPDATE ON public.server_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial server stats record
INSERT INTO public.server_stats (players_online, max_players, queue_count, uptime_percentage, ping_ms)
VALUES (0, 300, 0, 99.9, 15);

-- Enable realtime for the server_stats table
ALTER TABLE public.server_stats REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.server_stats;