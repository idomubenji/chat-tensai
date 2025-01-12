DROP POLICY IF EXISTS "Enable read access for authenticated users" ON channels; CREATE POLICY "Enable read access for authenticated users" ON channels FOR SELECT USING (true);
