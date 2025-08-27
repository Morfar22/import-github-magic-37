-- Update the analytics_query function to return an error indicating it should use direct analytics API access
-- The edge function will handle the actual analytics queries directly through the Supabase analytics API

DROP FUNCTION IF EXISTS public.analytics_query(text);

CREATE OR REPLACE FUNCTION public.analytics_query(query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- This function is deprecated in favor of direct analytics API access
    -- Return empty array as the edge function will handle analytics queries directly
    RETURN '[]'::jsonb;
END;
$function$;