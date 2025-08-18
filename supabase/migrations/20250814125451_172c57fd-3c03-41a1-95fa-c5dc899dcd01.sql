-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  steam_name TEXT NOT NULL,
  discord_tag TEXT NOT NULL,
  fivem_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 16),
  rp_experience TEXT NOT NULL,
  character_backstory TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'under_review')),
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create application actions log table
CREATE TABLE public.application_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'denied', 'under_review', 'notes_added')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_actions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'moderator')
  )
$$;

-- RLS Policies for applications
CREATE POLICY "Users can view their own applications"
ON public.applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
ON public.applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all applications"
ON public.applications
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update applications"
ON public.applications
FOR UPDATE
USING (public.is_staff(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for application_actions
CREATE POLICY "Staff can view application actions"
ON public.application_actions
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create application actions"
ON public.application_actions
FOR INSERT
WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = staff_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to include additional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steam_id TEXT;

-- Create function to handle profile creation with username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', new.email));
  
  -- Give user role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user profile creation (replace existing one)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();