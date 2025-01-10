-- Grant necessary permissions to the service role
GRANT USAGE ON SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;

-- Create ENUMs if they don't exist
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('ONLINE', 'OFFLINE', 'AWAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_role AS ENUM ('ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create function to check RLS status
CREATE OR REPLACE FUNCTION public.check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = table_name
    AND c.relrowsecurity = true
  );
END;
$$;

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  status user_status DEFAULT 'ONLINE'::user_status,
  role user_role DEFAULT 'USER'::user_role,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  created_by_id text REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS public.channel_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id text REFERENCES public.users(id) ON DELETE CASCADE,
  role_in_channel channel_role DEFAULT 'MEMBER'::channel_role,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id text REFERENCES public.users(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id text REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  name text NOT NULL,
  size bigint NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_files_message_id ON public.files(message_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at(); 