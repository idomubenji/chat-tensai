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

-- Drop existing policies first to handle dependencies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Public channels are viewable by everyone" ON channels;
DROP POLICY IF EXISTS "Channel members can insert messages" ON messages;
DROP POLICY IF EXISTS "Channel members can view messages" ON messages;
DROP POLICY IF EXISTS "Message authors can update their messages" ON messages;
DROP POLICY IF EXISTS "Channel members can add reactions" ON message_reactions;
DROP POLICY IF EXISTS "Channel members can view reactions" ON message_reactions;
DROP POLICY IF EXISTS "Channel members can view files" ON files;

-- Drop existing tables if they exist (comment out if you want to preserve data)
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  status user_status NOT NULL DEFAULT 'OFFLINE',
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create channel_members table
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_channel channel_role NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_files_message_id ON files(message_id);
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
EXCEPTION
    WHEN others THEN null;
END $$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate triggers to avoid duplicates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_channels_updated_at ON channels;
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all users
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Channels policies
CREATE POLICY "Public channels are viewable by everyone" ON channels
  FOR SELECT USING (NOT is_private OR EXISTS (
    SELECT 1 FROM channel_members WHERE channel_id = id AND user_id = auth.uid()::text
  ));

CREATE POLICY "Channel members can insert messages" ON messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid()::text
  ));

-- Messages are viewable by channel members
CREATE POLICY "Channel members can view messages" ON messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM channel_members WHERE channel_id = messages.channel_id AND user_id = auth.uid()::text
  ));

-- Message authors can update their messages
CREATE POLICY "Message authors can update their messages" ON messages
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Channel members can add reactions
CREATE POLICY "Channel members can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM messages m
    JOIN channel_members cm ON m.channel_id = cm.channel_id
    WHERE m.id = message_id AND cm.user_id = auth.uid()::text
  ));

-- Channel members can view reactions
CREATE POLICY "Channel members can view reactions" ON message_reactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM messages m
    JOIN channel_members cm ON m.channel_id = cm.channel_id
    WHERE m.id = message_id AND cm.user_id = auth.uid()::text
  ));

-- Files policies similar to messages
CREATE POLICY "Channel members can view files" ON files
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM messages m
    JOIN channel_members cm ON m.channel_id = cm.channel_id
    WHERE m.id = message_id AND cm.user_id = auth.uid()::text
  )); 