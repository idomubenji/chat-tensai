-- Drop the old function
DROP FUNCTION IF EXISTS set_channel_member_role(UUID, TEXT, channel_role);

-- Create the fixed function
CREATE OR REPLACE FUNCTION set_channel_member_role(p_channel_id UUID, p_user_id TEXT, p_role channel_role)
RETURNS void AS $$
BEGIN
  UPDATE channel_members
  SET role_in_channel = p_role::text
  WHERE channel_id = p_channel_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql; 