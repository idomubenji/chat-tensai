-- Add missing RLS policies for channels
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.channels;
CREATE POLICY "Enable insert for authenticated users"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = created_by_id::text);

DROP POLICY IF EXISTS "Enable update for channel creator" ON public.channels;
CREATE POLICY "Enable update for channel creator"
ON public.channels
FOR UPDATE
TO authenticated
USING (auth.uid()::text = created_by_id::text)
WITH CHECK (auth.uid()::text = created_by_id::text);

-- Add missing RLS policies for messages
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.messages;
CREATE POLICY "Enable insert for authenticated users"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Enable update for message author" ON public.messages;
CREATE POLICY "Enable update for message author"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Enable delete for message author" ON public.messages;
CREATE POLICY "Enable delete for message author"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text); 