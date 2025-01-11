-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Channel members can be created by admins" ON channel_members;
DROP POLICY IF EXISTS "Channel members are viewable by authenticated users" ON channel_members;

-- Create more permissive policies
CREATE POLICY "Users can view channel members"
  ON channel_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can join public channels"
  ON channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = channel_id
      AND NOT c.is_private
    )
    AND user_id = auth.uid()::text
  );

CREATE POLICY "Admins can manage channel members"
  ON channel_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()::text
      AND cm.role_in_channel = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members cm
      WHERE cm.channel_id = channel_members.channel_id
      AND cm.user_id = auth.uid()::text
      AND cm.role_in_channel = 'ADMIN'
    )
  ); 