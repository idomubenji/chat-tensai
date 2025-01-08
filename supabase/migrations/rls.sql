-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON channels;
DROP POLICY IF EXISTS "Channel members can insert messages" ON messages;
DROP POLICY IF EXISTS "Channel members can view messages" ON messages;
DROP POLICY IF EXISTS "Message authors can update their messages" ON messages;
DROP POLICY IF EXISTS "Channel members can add reactions" ON message_reactions;
DROP POLICY IF EXISTS "Channel members can view reactions" ON message_reactions;
DROP POLICY IF EXISTS "Channel members can view files" ON files;

-- Users policies
CREATE POLICY "Users are viewable by authenticated users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  USING (auth.uid()::text = id);

-- Channels policies
CREATE POLICY "Public channels are viewable by authenticated users"
  ON channels FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      NOT is_private OR 
      EXISTS (
        SELECT 1 FROM channel_members 
        WHERE channel_id = id AND user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Admin users can create channels"
  ON channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'ADMIN'
    )
  );

-- Channel members policies
CREATE POLICY "Channel members are viewable by channel members"
  ON channel_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channel_id 
      AND cm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Admin users can manage channel members"
  ON channel_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'ADMIN'
    )
  );

-- Messages policies
CREATE POLICY "Channel members can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_id = messages.channel_id 
      AND user_id = auth.uid()::text
    )
  );

CREATE POLICY "Channel members can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_id = messages.channel_id 
      AND user_id = auth.uid()::text
    )
  );

CREATE POLICY "Message authors can update their messages"
  ON messages FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Message authors can delete their messages"
  ON messages FOR DELETE
  USING (auth.uid()::text = user_id);

-- Message reactions policies
CREATE POLICY "Channel members can view reactions"
  ON message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Channel members can add reactions"
  ON message_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  USING (auth.uid()::text = user_id);

-- Files policies
CREATE POLICY "Channel members can view files"
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Channel members can upload files"
  ON files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.uid()::text
    )
  ); 