-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Create function to get auth ID as text
CREATE OR REPLACE FUNCTION auth.uid_text() RETURNS text AS $$
  SELECT auth.uid()::text;
$$ LANGUAGE sql STABLE;

-- Users policies
CREATE POLICY "Users are viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid_text())
  WITH CHECK (id = auth.uid_text());

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
      WHERE id = auth.uid_text()
      AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admin users can delete channels"
  ON channels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid_text()
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
  USING (user_id = auth.uid_text())
  WITH CHECK (user_id = auth.uid_text());

CREATE POLICY "Message authors can delete their messages"
  ON messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid_text());

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
  USING (user_id = auth.uid_text());

-- Files policies
CREATE POLICY "Files are viewable by authenticated users"
  ON files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Channel members policies
CREATE POLICY "Channel members are viewable by authenticated users"
  ON channel_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Channel members can be created by admins"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid_text()
      AND role = 'ADMIN'
    )
  );

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

CREATE POLICY "Service role can manage channel members"
  ON channel_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update user table schema to align with Supabase Auth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ; 