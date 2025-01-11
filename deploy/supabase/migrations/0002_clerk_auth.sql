-- Enable Clerk authentication
DROP FUNCTION IF EXISTS auth.uid();
DROP FUNCTION IF EXISTS public.auth_uid();

CREATE OR REPLACE FUNCTION public.auth_uid() RETURNS text AS $$
DECLARE
  claims json;
  debug_info text;
  headers text;
BEGIN
  -- Get the headers
  headers := current_setting('request.headers', true);
  RAISE NOTICE 'Request headers: %', headers;

  -- Get the claims
  BEGIN
    claims := current_setting('request.jwt.claims', true)::json;
    RAISE NOTICE 'JWT claims parsed: %', claims;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error parsing JWT claims: %, Headers: %', SQLERRM, headers;
      RETURN NULL;
  END;
  
  -- Build debug info
  debug_info := format(
    'JWT Claims - raw: %s, headers: %s, userId: %s, sub: %s',
    current_setting('request.jwt.claims', true),
    headers,
    claims->>'userId',
    claims->>'sub'
  );
  
  -- Log the debug info
  RAISE NOTICE '%', debug_info;

  -- Return the actual user ID from claims
  RETURN claims->>'userId';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in auth_uid(): %, Headers: %', SQLERRM, headers;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create an alias in the auth schema that points to our public function
CREATE OR REPLACE FUNCTION auth.uid() RETURNS text AS $$
  SELECT public.auth_uid();
$$ LANGUAGE sql STABLE; 