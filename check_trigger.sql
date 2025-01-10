-- Check if trigger exists
SELECT tgname, tgrelid::regclass as table_name, tgtype, proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $BODY$
DECLARE
  _name text;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger handle_new_user executing for user %', NEW.id;

  -- Get the name from metadata or fall back to email
  _name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  
  -- Log the data we're going to insert
  RAISE NOTICE 'Inserting user with id: %, email: %, name: %', NEW.id, NEW.email, _name;

  -- Insert into public.users
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, _name);

  -- Log successful user creation
  RAISE NOTICE 'Successfully created user in public.users';

  -- Add the user to the general channel if it exists
  INSERT INTO public.channel_members (channel_id, user_id)
  SELECT id, NEW.id
  FROM public.channels
  WHERE name = 'general'
  ON CONFLICT DO NOTHING;

  -- Log channel membership
  RAISE NOTICE 'Added user to general channel';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Update RLS policies to allow the trigger to work
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER; 