-- Enable real-time for specific tables
alter publication supabase_realtime add table "Message";
alter publication supabase_realtime add table "ChannelMember";
alter publication supabase_realtime add table "User";

-- Enable row level security
alter table "Message" enable row level security;
alter table "ChannelMember" enable row level security;
alter table "Channel" enable row level security;
alter table "User" enable row level security;
alter table "File" enable row level security;

-- Policies for Message table
create policy "Users can read messages in their channels"
  on "Message"
  for select
  using (
    exists (
      select 1 from "ChannelMember"
      where "ChannelMember"."channelId" = "Message"."channelId"
      and "ChannelMember"."userId" = auth.uid()
    )
  );

create policy "Users can insert messages in their channels"
  on "Message"
  for insert
  with check (
    exists (
      select 1 from "ChannelMember"
      where "ChannelMember"."channelId" = "Message"."channelId"
      and "ChannelMember"."userId" = auth.uid()
    )
  );

-- Policies for Channel table
create policy "Users can read channels they are members of"
  on "Channel"
  for select
  using (
    exists (
      select 1 from "ChannelMember"
      where "ChannelMember"."channelId" = "Channel"."id"
      and "ChannelMember"."userId" = auth.uid()
    )
  );

create policy "Admins can create channels"
  on "Channel"
  for insert
  with check (
    exists (
      select 1 from "User"
      where "User"."id" = auth.uid()
      and "User"."role" = 'ADMIN'
    )
  );

-- Policies for ChannelMember table
create policy "Users can see channel members in their channels"
  on "ChannelMember"
  for select
  using (
    exists (
      select 1 from "ChannelMember" as cm
      where cm."channelId" = "ChannelMember"."channelId"
      and cm."userId" = auth.uid()
    )
  );

-- Policies for User table
create policy "Users can read all users"
  on "User"
  for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on "User"
  for update
  using (auth.uid() = id);

-- Policies for File table
create policy "Users can read files in their channels"
  on "File"
  for select
  using (
    exists (
      select 1 from "Message"
      join "ChannelMember" on "Message"."channelId" = "ChannelMember"."channelId"
      where "File"."messageId" = "Message"."id"
      and "ChannelMember"."userId" = auth.uid()
    )
  );

create policy "Users can upload files to their channels"
  on "File"
  for insert
  with check (
    exists (
      select 1 from "Message"
      join "ChannelMember" on "Message"."channelId" = "ChannelMember"."channelId"
      where "File"."messageId" = "Message"."id"
      and "ChannelMember"."userId" = auth.uid()
    )
  ); 