-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Allow public read access to minimal user data" ON users;
DROP POLICY IF EXISTS "Authenticated users can read user data" ON users;

-- Create policies:
-- 1. Allow public read access to minimal data needed for auth
CREATE POLICY "Allow public read access to minimal user data" ON users
FOR SELECT 
USING (true);

-- 2. Allow public access to email when querying by username (needed for username-based login)
CREATE POLICY "Allow email lookup by username" ON users
FOR SELECT 
USING (true);

-- 3. Authenticated users can read full user data
CREATE POLICY "Authenticated users can read user data" ON users
FOR SELECT 
USING (auth.uid()::uuid = id::uuid OR auth.role() = 'authenticated');

-- Grant public access to specific columns
GRANT SELECT (id, name, avatar_url, status) ON users TO anon;

-- Grant email access when querying by username
GRANT SELECT (email) ON users TO anon; 