-- Drop conflicting policies
DROP POLICY IF EXISTS "Admin users can create channels" ON public.channels;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.channels;

-- Create new policy that allows any authenticated user to create channels
CREATE POLICY "Users can create channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = created_by_id
);

-- Grant INSERT permission to authenticated users
GRANT INSERT ON public.channels TO authenticated;

-- Add channels to realtime publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'channels'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE channels;
    END IF;
END $$; 