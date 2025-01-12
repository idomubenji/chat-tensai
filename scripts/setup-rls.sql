-- Enable RLS on all tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view channels they are members of" ON channels;
DROP POLICY IF EXISTS "Users can create channels" ON channels;
DROP POLICY IF EXISTS "Users can view messages in their channels" ON messages;
DROP POLICY IF EXISTS "Users can view reactions in their channels" ON message_reactions;
DROP POLICY IF EXISTS "Users can view other users" ON users;
DROP POLICY IF EXISTS "Users can view files in their channels" ON files;

-- Channel policies
CREATE POLICY "Authenticated users can view all channels"
ON channels FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create channels"
ON channels FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Message policies
CREATE POLICY "Users can view messages in channels"
ON messages FOR ALL
USING (auth.role() = 'authenticated');

-- Message reaction policies
CREATE POLICY "Users can view reactions"
ON message_reactions FOR ALL
USING (auth.role() = 'authenticated');

-- User policies
CREATE POLICY "Users can view other users"
ON users FOR SELECT
USING (true);  -- Everyone can view user profiles

-- File policies
CREATE POLICY "Users can view files"
ON files FOR ALL
USING (auth.role() = 'authenticated');

-- Grant necessary permissions to authenticated users
GRANT ALL ON channels TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_reactions TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON files TO authenticated; 