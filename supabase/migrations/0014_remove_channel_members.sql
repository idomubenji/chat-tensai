-- Drop related indexes first
DROP INDEX IF EXISTS idx_channel_members_user_id;
DROP INDEX IF EXISTS idx_channel_members_channel_id;

-- Drop the function that uses the channel_role type
DROP FUNCTION IF EXISTS set_channel_member_role(UUID, TEXT, channel_role);

-- Drop channel_members table and related fields
DROP TABLE IF EXISTS public.channel_members;

-- Remove is_private from channels since all channels are public
ALTER TABLE public.channels DROP COLUMN IF EXISTS is_private;

-- Now we can safely drop the enum since no tables or functions are using it
DROP TYPE IF EXISTS channel_role;

-- Update RLS policies to reflect that all authenticated users can access all channels
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.channels;
CREATE POLICY "Enable read access for all authenticated users"
ON public.channels
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable read access for all messages to authenticated users" ON public.messages;
CREATE POLICY "Enable read access for all messages to authenticated users"
ON public.messages
FOR SELECT
TO authenticated
USING (true); 