-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they are properly applied
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;

-- Create read policy
CREATE POLICY "Users are viewable by authenticated users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Create update policy
CREATE POLICY "Users can update their own record"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text); 