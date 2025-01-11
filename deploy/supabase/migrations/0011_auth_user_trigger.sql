-- Create a trigger function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'username',  -- Try to get username from metadata
      new.raw_user_meta_data->>'name',      -- Fall back to name from metadata
      new.email                             -- Finally fall back to email
    )
  );

  -- Add the user to all channels
  INSERT INTO public.channel_members (channel_id, user_id, role_in_channel)
  SELECT id, new.id, 'MEMBER'
  FROM public.channels
  ON CONFLICT DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to allow the trigger to work
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER; 