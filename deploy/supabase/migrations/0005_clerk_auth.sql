-- Drop existing policies
DROP POLICY IF EXISTS "Users are viewable by authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON channels;
DROP POLICY IF EXISTS "Channel members can insert messages" ON messages;
DROP POLICY IF EXISTS "Channel members can view messages" ON messages;
DROP POLICY IF EXISTS "Message authors can update their messages" ON messages;
DROP POLICY IF EXISTS "Channel members can add reactions" ON message_reactions;
DROP POLICY IF EXISTS "Channel members can view reactions" ON message_reactions;
DROP POLICY IF EXISTS "Channel members can view files" ON files;
DROP POLICY IF EXISTS "Channel members are viewable by authenticated users" ON channel_members;

-- Create new policies that are completely permissive
CREATE POLICY "Allow all access to users"
  ON users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to channels"
  ON channels FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to channel_members"
  ON channel_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to messages"
  ON messages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to message_reactions"
  ON message_reactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to files"
  ON files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true); 