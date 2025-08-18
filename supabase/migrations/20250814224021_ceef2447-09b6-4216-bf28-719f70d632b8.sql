-- Create a table for managing multiple servers
CREATE TABLE public.servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 30120,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Create policies for server access
CREATE POLICY "Staff can view all servers" 
ON public.servers 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can create servers" 
ON public.servers 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Staff can update servers" 
ON public.servers 
FOR UPDATE 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete servers" 
ON public.servers 
FOR DELETE 
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_servers_updated_at
BEFORE UPDATE ON public.servers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a table for storing individual server statistics
CREATE TABLE public.individual_server_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  players_online INTEGER NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 300,
  queue_count INTEGER NOT NULL DEFAULT 0,
  uptime_percentage NUMERIC NOT NULL DEFAULT 99.9,
  ping_ms INTEGER NOT NULL DEFAULT 15,
  server_online BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.individual_server_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for server stats access
CREATE POLICY "Everyone can view server stats" 
ON public.individual_server_stats 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage server stats" 
ON public.individual_server_stats 
FOR ALL 
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_individual_server_stats_updated_at
BEFORE UPDATE ON public.individual_server_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();