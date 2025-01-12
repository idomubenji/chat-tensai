-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated users
GRANT SELECT ON public.channels TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.files TO authenticated;
GRANT SELECT ON public.message_reactions TO authenticated;

-- Grant specific write permissions
GRANT INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT INSERT ON public.files TO authenticated;

-- Channel policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.channels;
CREATE POLICY "Enable read access for authenticated users"
ON public.channels
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.channels;
CREATE POLICY "Enable insert for authenticated users"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = created_by_id::text);

-- Message policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.messages;
CREATE POLICY "Enable read access for authenticated users"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

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

-- User policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
CREATE POLICY "Enable read access for authenticated users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- Message reaction policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.message_reactions;
CREATE POLICY "Enable read access for authenticated users"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.message_reactions;
CREATE POLICY "Enable insert for authenticated users"
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Enable delete for reaction author" ON public.message_reactions;
CREATE POLICY "Enable delete for reaction author"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- File policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.files;
CREATE POLICY "Enable read access for authenticated users"
ON public.files
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.files;
CREATE POLICY "Enable insert for authenticated users"
ON public.files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = uploaded_by::text); 