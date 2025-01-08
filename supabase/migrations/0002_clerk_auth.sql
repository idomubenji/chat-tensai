-- Enable Clerk authentication
DROP FUNCTION IF EXISTS auth.user_id();

CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'sub',
    (current_setting('request.jwt.claims', true)::json->>'userId')::text
  );
$$ LANGUAGE SQL STABLE;

-- Update RLS policies to use Clerk's user ID
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
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.user_id());

CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Channels policies
CREATE POLICY "Public channels are viewable by authenticated users"
  ON channels FOR SELECT
  TO authenticated
  USING (
    NOT is_private OR 
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_id = id AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Admin users can create channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.user_id() 
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Service role can manage channels"
  ON channels FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Channel members policies
CREATE POLICY "Channel members are viewable by channel members"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channel_id 
      AND cm.user_id = auth.user_id()
    )
  );

CREATE POLICY "Admin users can manage channel members"
  ON channel_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.user_id() 
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Service role can manage channel members"
  ON channel_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Messages policies
CREATE POLICY "Channel members can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_id = messages.channel_id 
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Channel members can create messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members 
      WHERE channel_id = messages.channel_id 
      AND user_id = auth.user_id()
    )
  );

CREATE POLICY "Message authors can update their messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Message authors can delete their messages"
  ON messages FOR DELETE
  TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Service role can manage messages"
  ON messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Message reactions policies
CREATE POLICY "Channel members can view reactions"
  ON message_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.user_id()
    )
  );

CREATE POLICY "Channel members can add reactions"
  ON message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.user_id()
    )
  );

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Service role can manage reactions"
  ON message_reactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Files policies
CREATE POLICY "Channel members can view files"
  ON files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.user_id()
    )
  );

CREATE POLICY "Channel members can upload files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN channel_members cm ON m.channel_id = cm.channel_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.user_id()
    )
  );

CREATE POLICY "Service role can manage files"
  ON files FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 