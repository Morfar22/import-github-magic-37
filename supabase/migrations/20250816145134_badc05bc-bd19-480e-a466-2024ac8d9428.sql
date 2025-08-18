-- Create audit logs table for security tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs
CREATE POLICY "Staff can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "System can create audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create failed login attempts table
CREATE TABLE public.failed_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for failed login attempts
CREATE POLICY "Staff can view failed login attempts" 
ON public.failed_login_attempts 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "System can manage failed login attempts" 
ON public.failed_login_attempts 
FOR ALL 
USING (true);

-- Create user sessions table for session management
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all sessions" 
ON public.user_sessions 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "System can manage sessions" 
ON public.user_sessions 
FOR ALL 
USING (true);

-- Create application rate limiting table
CREATE TABLE public.application_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  email TEXT,
  application_count INTEGER NOT NULL DEFAULT 1,
  first_application TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_application TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.application_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for rate limits
CREATE POLICY "Staff can view rate limits" 
ON public.application_rate_limits 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "System can manage rate limits" 
ON public.application_rate_limits 
FOR ALL 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_failed_logins_ip ON public.failed_login_attempts(ip_address);
CREATE INDEX idx_failed_logins_email ON public.failed_login_attempts(email);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_rate_limits_ip ON public.application_rate_limits(ip_address);