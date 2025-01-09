-- Create function to set channel member role
CREATE OR REPLACE FUNCTION set_channel_member_role(p_channel_id UUID, p_user_id TEXT, p_role channel_role)
RETURNS void AS $$
BEGIN
  UPDATE channel_members
  SET role = p_role
  WHERE channel_id = p_channel_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql; 