-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
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
DROP POLICY IF EXISTS "Channels are viewable by members" ON channels;
DROP POLICY IF EXISTS "Channel members are viewable by channel members" ON channel_members;
DROP POLICY IF EXISTS "Allow all access to channels" ON channels;

-- Users policies
CREATE POLICY "Users are viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth_uid());

-- Channels policies
CREATE POLICY "Channels are viewable by authenticated users"
  ON channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can create channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth_uid()
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admin users can delete channels"
  ON channels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth_uid()
      AND role = 'ADMIN'
    )
  );

-- Messages policies
CREATE POLICY "Messages are viewable by authenticated users"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Message authors can update their messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (user_id = auth_uid())
  WITH CHECK (user_id = auth_uid());

CREATE POLICY "Message authors can delete their messages"
  ON messages FOR DELETE
  TO authenticated
  USING (user_id = auth_uid());

-- Message reactions policies
CREATE POLICY "Message reactions are viewable by authenticated users"
  ON message_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON message_reactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can remove their own reactions"
  ON message_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth_uid());

-- Files policies
CREATE POLICY "Files are viewable by authenticated users"
  ON files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role policies
CREATE POLICY "Service role can manage all tables"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage channels"
  ON channels FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage messages"
  ON messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage reactions"
  ON message_reactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage files"
  ON files FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true); 