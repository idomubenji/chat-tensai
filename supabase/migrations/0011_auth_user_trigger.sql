-- Create a trigger function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email));

  -- Add the user to the general channel if it exists
  INSERT INTO public.channel_members (channel_id, user_id)
  SELECT id, new.id
  FROM public.channels
  WHERE name = 'general'
  ON CONFLICT DO NOTHING;

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