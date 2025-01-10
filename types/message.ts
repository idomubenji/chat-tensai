export interface Message {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
    role?: string;
  };
  reactions: {
    [key: string]: {
      emoji: string;
      userIds: string[];
      users?: { name: string }[];
    };
  };
  replies?: Message[];
} 