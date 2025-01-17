-- Drop existing policy
DROP POLICY IF EXISTS "Users can update their own record" ON users;

-- Create new policy with text comparison
CREATE POLICY "Users can update their own record"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text); 