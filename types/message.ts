export interface Message {
  id: string;
  content: string;
  channelId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
  threadMessages: Message[];
} 