-- Create laws table for city legislation
CREATE TABLE public.laws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  fine_amount INTEGER DEFAULT 0,
  jail_time_minutes INTEGER DEFAULT 0,
  severity_level TEXT NOT NULL DEFAULT 'Minor', -- Minor, Moderate, Severe
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.laws ENABLE ROW LEVEL SECURITY;

-- Anyone can view active laws
CREATE POLICY "Anyone can view active laws"
ON public.laws
FOR SELECT
USING (is_active = true);

-- Staff can manage laws
CREATE POLICY "Staff can manage laws"
ON public.laws
FOR ALL
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_laws_updated_at
BEFORE UPDATE ON public.laws
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();