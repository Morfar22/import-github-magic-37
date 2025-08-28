-- Create supporters table to track donations and supporter status
CREATE TABLE public.supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount donated (in cents)
  currency TEXT DEFAULT 'usd',
  supporter_tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum, diamond
  donation_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_featured BOOLEAN DEFAULT false, -- For highlighting top supporters
  message TEXT, -- Optional supporter message
  is_anonymous BOOLEAN DEFAULT false, -- Hide name but show as anonymous supporter
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view public supporters" 
ON public.supporters 
FOR SELECT 
USING (NOT is_anonymous OR auth.uid() = user_id);

CREATE POLICY "Users can view their own supporter status" 
ON public.supporters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage supporters" 
ON public.supporters 
FOR ALL 
USING (is_staff(auth.uid()));

CREATE POLICY "System can insert supporters" 
ON public.supporters 
FOR INSERT 
WITH CHECK (true);

-- Create function to determine supporter tier based on total donations
CREATE OR REPLACE FUNCTION public.calculate_supporter_tier(total_amount INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF total_amount >= 50000 THEN -- $500+
    RETURN 'diamond';
  ELSIF total_amount >= 25000 THEN -- $250+
    RETURN 'platinum';
  ELSIF total_amount >= 10000 THEN -- $100+
    RETURN 'gold';
  ELSIF total_amount >= 5000 THEN -- $50+
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$;

-- Create function to get user supporter status
CREATE OR REPLACE FUNCTION public.get_user_supporter_status(check_user_id UUID)
RETURNS TABLE(
  total_donated INTEGER,
  tier TEXT,
  latest_donation TIMESTAMP WITH TIME ZONE,
  is_supporter BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(s.amount), 0)::INTEGER as total_donated,
    CASE 
      WHEN SUM(s.amount) IS NULL THEN 'none'::TEXT
      ELSE calculate_supporter_tier(SUM(s.amount)::INTEGER)
    END as tier,
    MAX(s.donation_date) as latest_donation,
    CASE WHEN SUM(s.amount) > 0 THEN true ELSE false END as is_supporter
  FROM public.supporters s
  WHERE s.user_id = check_user_id;
END;
$$;