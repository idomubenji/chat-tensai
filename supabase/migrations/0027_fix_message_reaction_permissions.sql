-- Grant basic permissions to authenticated users for message reactions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT SELECT ON public.messages TO authenticated;
GRANT SELECT ON public.users TO authenticated;

-- Drop existing policies to clean up (all possible names)
DROP POLICY IF EXISTS "Channel members can add reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Channel members can view reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can view reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.message_reactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.message_reactions;
DROP POLICY IF EXISTS "Enable delete for reaction author" ON public.message_reactions;

-- Create updated policies
CREATE POLICY "Users can add reactions"
ON public.message_reactions
FOR INSERT 
TO authenticated
WITH CHECK (
  message_reactions.user_id = auth.uid()::text
);

CREATE POLICY "Users can view reactions"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);

-- Add policy for messages to allow viewing with reactions
CREATE POLICY "Users can view messages with reactions"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Enable realtime for all required tables (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'message_reactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
    END IF;
END
$$; 