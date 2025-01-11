

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ChannelRole" AS ENUM (
    'ADMIN',
    'MEMBER'
);


ALTER TYPE "public"."ChannelRole" OWNER TO "postgres";


CREATE TYPE "public"."UserRole" AS ENUM (
    'ADMIN',
    'USER'
);


ALTER TYPE "public"."UserRole" OWNER TO "postgres";


CREATE TYPE "public"."UserStatus" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'AWAY'
);


ALTER TYPE "public"."UserStatus" OWNER TO "postgres";


CREATE TYPE "public"."channel_role" AS ENUM (
    'ADMIN',
    'MEMBER'
);


ALTER TYPE "public"."channel_role" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'ADMIN',
    'USER'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_status" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'AWAY'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Channel" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "isPrivate" boolean DEFAULT false NOT NULL,
    "createdById" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Channel" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ChannelMember" (
    "id" "text" NOT NULL,
    "channelId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "roleInChannel" "public"."ChannelRole" DEFAULT 'MEMBER'::"public"."ChannelRole" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."ChannelMember" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."File" (
    "id" "text" NOT NULL,
    "url" "text" NOT NULL,
    "messageId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."File" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Message" (
    "id" "text" NOT NULL,
    "content" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "channelId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "parentId" "text"
);


ALTER TABLE "public"."Message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."MessageReaction" (
    "messageId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."MessageReaction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "avatarUrl" "text",
    "status" "public"."UserStatus" DEFAULT 'OFFLINE'::"public"."UserStatus" NOT NULL,
    "role" "public"."UserRole" DEFAULT 'USER'::"public"."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channel_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "role_in_channel" "public"."channel_role" DEFAULT 'MEMBER'::"public"."channel_role" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."channel_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_private" boolean DEFAULT false NOT NULL,
    "created_by_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url" "text" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "message_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_url" "text",
    "status" "public"."user_status" DEFAULT 'OFFLINE'::"public"."user_status" NOT NULL,
    "role" "public"."user_role" DEFAULT 'USER'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bio" "text",
    "status_message" "text",
    "status_emoji" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ChannelMember"
    ADD CONSTRAINT "ChannelMember_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Channel"
    ADD CONSTRAINT "Channel_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."File"
    ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."MessageReaction"
    ADD CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageId", "userId", "emoji");



ALTER TABLE ONLY "public"."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channel_members"
    ADD CONSTRAINT "channel_members_channel_id_user_id_key" UNIQUE ("channel_id", "user_id");



ALTER TABLE ONLY "public"."channel_members"
    ADD CONSTRAINT "channel_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("message_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "ChannelMember_channelId_userId_key" ON "public"."ChannelMember" USING "btree" ("channelId", "userId");



CREATE UNIQUE INDEX "Channel_name_key" ON "public"."Channel" USING "btree" ("name");



CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");



CREATE INDEX "idx_channel_members_channel_id" ON "public"."channel_members" USING "btree" ("channel_id");



CREATE INDEX "idx_channel_members_user_id" ON "public"."channel_members" USING "btree" ("user_id");



CREATE INDEX "idx_files_message_id" ON "public"."files" USING "btree" ("message_id");



CREATE INDEX "idx_files_user_id" ON "public"."files" USING "btree" ("user_id");



CREATE INDEX "idx_message_reactions_message_id" ON "public"."message_reactions" USING "btree" ("message_id");



CREATE INDEX "idx_message_reactions_user_id" ON "public"."message_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_messages_channel_id" ON "public"."messages" USING "btree" ("channel_id");



CREATE INDEX "idx_messages_parent_id" ON "public"."messages" USING "btree" ("parent_id");



CREATE INDEX "idx_messages_user_id" ON "public"."messages" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_channels_updated_at" BEFORE UPDATE ON "public"."channels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ChannelMember"
    ADD CONSTRAINT "ChannelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ChannelMember"
    ADD CONSTRAINT "ChannelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."File"
    ADD CONSTRAINT "File_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."File"
    ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."MessageReaction"
    ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."MessageReaction"
    ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Message"
    ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Message"
    ADD CONSTRAINT "Message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Message"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Message"
    ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."channel_members"
    ADD CONSTRAINT "channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."channel_members"
    ADD CONSTRAINT "channel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin users can create channels" ON "public"."channels" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."user_id"()) AND ("users"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin users can manage channel members" ON "public"."channel_members" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."user_id"()) AND ("users"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Channel members are viewable by channel members" ON "public"."channel_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."channel_members" "cm"
  WHERE (("cm"."channel_id" = "cm"."channel_id") AND ("cm"."user_id" = "auth"."user_id"())))));



CREATE POLICY "Channel members can add reactions" ON "public"."message_reactions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."channel_members" "cm" ON (("m"."channel_id" = "cm"."channel_id")))
  WHERE (("m"."id" = "message_reactions"."message_id") AND ("cm"."user_id" = "auth"."user_id"())))));



CREATE POLICY "Channel members can create messages" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."channel_members"
  WHERE (("channel_members"."channel_id" = "messages"."channel_id") AND ("channel_members"."user_id" = "auth"."user_id"())))));



CREATE POLICY "Channel members can upload files" ON "public"."files" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."channel_members" "cm" ON (("m"."channel_id" = "cm"."channel_id")))
  WHERE (("m"."id" = "files"."message_id") AND ("cm"."user_id" = "auth"."user_id"())))));



CREATE POLICY "Channel members can view files" ON "public"."files" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."channel_members" "cm" ON (("m"."channel_id" = "cm"."channel_id")))
  WHERE (("m"."id" = "files"."message_id") AND ("cm"."user_id" = "auth"."user_id"())))));



CREATE POLICY "Channel members can view messages" ON "public"."messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."channel_members"
  WHERE (("channel_members"."channel_id" = "messages"."channel_id") AND ("channel_members"."user_id" = "auth"."user_id"())))));



CREATE POLICY "Channel members can view reactions" ON "public"."message_reactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."messages" "m"
     JOIN "public"."channel_members" "cm" ON (("m"."channel_id" = "cm"."channel_id")))
  WHERE (("m"."id" = "message_reactions"."message_id") AND ("cm"."user_id" = "auth"."user_id"())))));



CREATE POLICY "Message authors can delete their messages" ON "public"."messages" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."user_id"()));



CREATE POLICY "Message authors can update their messages" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."user_id"()));



CREATE POLICY "Public channels are viewable by authenticated users" ON "public"."channels" FOR SELECT TO "authenticated" USING (((NOT "is_private") OR (EXISTS ( SELECT 1
   FROM "public"."channel_members"
  WHERE (("channel_members"."channel_id" = "channel_members"."id") AND ("channel_members"."user_id" = "auth"."user_id"()))))));



CREATE POLICY "Service role can manage channel members" ON "public"."channel_members" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage channels" ON "public"."channels" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage files" ON "public"."files" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage messages" ON "public"."messages" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage reactions" ON "public"."message_reactions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage users" ON "public"."users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users are viewable by authenticated users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can remove their own reactions" ON "public"."message_reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."user_id"()));



CREATE POLICY "Users can update their own record" ON "public"."users" FOR UPDATE TO "authenticated" USING (("id" = "auth"."user_id"()));



ALTER TABLE "public"."channel_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Channel";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."ChannelMember";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."File";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."MessageReaction";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."User";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."_prisma_migrations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."channel_members";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."channels";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."files";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."message_reactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "anon";



































































































































































































GRANT ALL ON TABLE "public"."Channel" TO "service_role";
GRANT ALL ON TABLE "public"."Channel" TO "authenticated";
GRANT ALL ON TABLE "public"."Channel" TO "anon";



GRANT ALL ON TABLE "public"."ChannelMember" TO "service_role";
GRANT ALL ON TABLE "public"."ChannelMember" TO "authenticated";
GRANT ALL ON TABLE "public"."ChannelMember" TO "anon";



GRANT ALL ON TABLE "public"."File" TO "service_role";
GRANT ALL ON TABLE "public"."File" TO "authenticated";
GRANT ALL ON TABLE "public"."File" TO "anon";



GRANT ALL ON TABLE "public"."Message" TO "service_role";
GRANT ALL ON TABLE "public"."Message" TO "authenticated";
GRANT ALL ON TABLE "public"."Message" TO "anon";



GRANT ALL ON TABLE "public"."MessageReaction" TO "service_role";
GRANT ALL ON TABLE "public"."MessageReaction" TO "authenticated";
GRANT ALL ON TABLE "public"."MessageReaction" TO "anon";



GRANT ALL ON TABLE "public"."User" TO "service_role";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "anon";



GRANT ALL ON TABLE "public"."_prisma_migrations" TO "service_role";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "anon";



GRANT ALL ON TABLE "public"."channel_members" TO "service_role";



GRANT ALL ON TABLE "public"."channels" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";



























RESET ALL;
