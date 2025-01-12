DROP POLICY "Users can update their own record" ON users; CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (auth.uid() = id::uuid) WITH CHECK (auth.uid() = id::uuid);
