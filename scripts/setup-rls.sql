-- Enable RLS on all tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view channels they are members of" ON channels;
DROP POLICY IF EXISTS "Users can create channels" ON channels;
DROP POLICY IF EXISTS "Users can view their channel memberships" ON channel_members;
DROP POLICY IF EXISTS "Users can create channel memberships" ON channel_members;
DROP POLICY IF EXISTS "Users can view messages in their channels" ON messages;
DROP POLICY IF EXISTS "Users can view reactions in their channels" ON message_reactions;
DROP POLICY IF EXISTS "Users can view other users" ON users;
DROP POLICY IF EXISTS "Users can view files in their channels" ON files;

-- Channel policies
CREATE POLICY "Users can view channels they are members of"
ON channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = channels.id
    AND channel_members.user_id = auth.uid()
  )
  OR (NOT is_private)  -- Allow viewing public channels
);

CREATE POLICY "Users can create channels"
ON channels FOR INSERT
WITH CHECK (true);  -- Allow any authenticated user to create channels

-- Channel member policies
CREATE POLICY "Users can view their channel memberships"
ON channel_members FOR ALL
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM channel_members cm
    WHERE cm.channel_id = channel_members.channel_id
    AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channel memberships"
ON channel_members FOR INSERT
WITH CHECK (true);  -- Allow any authenticated user to create memberships

-- Message policies
CREATE POLICY "Users can view messages in their channels"
ON messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM channel_members
    WHERE channel_members.channel_id = messages.channel_id
    AND channel_members.user_id = auth.uid()
  )
);

-- Message reaction policies
CREATE POLICY "Users can view reactions in their channels"
ON message_reactions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM channel_members cm
    JOIN messages m ON m.channel_id = cm.channel_id
    WHERE m.id = message_reactions.message_id
    AND cm.user_id = auth.uid()
  )
);

-- User policies
CREATE POLICY "Users can view other users"
ON users FOR SELECT
USING (true);  -- Everyone can view user profiles

-- File policies
CREATE POLICY "Users can view files in their channels"
ON files FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM channel_members cm
    JOIN messages m ON m.channel_id = cm.channel_id
    WHERE m.id = files.message_id
    AND cm.user_id = auth.uid()
  )
);

-- Grant necessary permissions to authenticated users
GRANT ALL ON channels TO authenticated;
GRANT ALL ON channel_members TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_reactions TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON files TO authenticated; 