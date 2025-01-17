-- Grant auth schema usage to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Grant access to auth.uid() function
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

-- Ensure users can update their own records
DROP POLICY IF EXISTS "Users can update their own record" ON users;
CREATE POLICY "Users can update their own record"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Ensure users can view all records
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
CREATE POLICY "Users are viewable by authenticated users"
ON users FOR SELECT
TO authenticated
USING (true); 