export type User = {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  status: "online" | "offline" | "away" | "busy";
  role: "admin" | "user";
  created_at: Date;
  updated_at: Date;
};

// Channel type
export type Channel = {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string; // User ID
  created_at: Date;
  updated_at: Date;
};

// ChannelMembers type
export type ChannelMember = {
  id: string;
  channel_id: string;
  user_id: string;
  role_in_channel: "owner" | "admin" | "member";
  joined_at: Date;
};

// Message type
export type Message = {
  id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  channel_id: string;
  user_id: string;
  parent_id: string | null; // For threaded messages
};

// File type
export type File = {
  id: string;
  url: string;
  uploaded_by: string; // User ID
  message_id: string;
  uploaded_at: Date;
};
