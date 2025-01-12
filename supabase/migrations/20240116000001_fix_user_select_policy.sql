DROP POLICY IF EXISTS "Users can read their own data" ON users; CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid()::uuid = id::uuid);
