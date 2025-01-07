"use client";

import { useEffect, useState } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThreadWindow } from "@/components/ThreadWindow";

// Temporary mock data - move to a shared location later
const mockChannels = [
  { id: "1", name: "general" },
  { id: "2", name: "random" },
  { id: "3", name: "project-a" },
];

type Message = {
  id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
  reactions: {
    [key: string]: {
      emoji: string;
      userIds: string[];
    };
  };
  replies?: Message[]; // Add this for thread support
  parentId?: string; // For identifying thread relationships
};

export default function ChannelPage({
  params,
}: {
  params: { channelId: string };
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channel = mockChannels.find((c) => c.id === params.channelId);
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
      return;
    }
    fetchMessages();
  }, [isLoaded, userId, params.channelId]);

  const fetchMessages = async () => {
    if (!userId) return; // Don't fetch if not authenticated
    try {
      const response = await fetch(
        `/api/channels/${params.channelId}/messages`
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSent = async (content: string) => {
    if (!userId) return; // Don't send if not authenticated
    try {
      const response = await fetch(
        `/api/channels/${params.channelId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      // Add the new message to the state immediately
      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReactionUpdate = (messageId: string, updatedReactions: Message['reactions']) => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, reactions: updatedReactions }
          : message
      )
    );
  };

  const handleMessageUpdate = (messageId: string, updates: Partial<Message>) => {
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === messageId 
          ? { ...message, ...updates }
          : message
      )
    );

    // If this is the selected message, update it in the state
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Return null while redirecting to sign-in
  if (!userId) {
    return null;
  }

  return (
    <div className="flex h-full">
      <div className={cn(
        "flex flex-col h-full",
        selectedMessage ? "w-[calc(100%-400px)]" : "w-full"
      )}>
        <div className="p-4 border-b bg-[#445566] text-white">
          <h1 className="text-2xl font-bold">
            #{channel?.name || "unknown-channel"}
          </h1>
        </div>
        <div className="flex-1 min-h-0">
          <ChatWindow
            channelId={params.channelId}
            messages={messages}
            onSendMessage={handleMessageSent}
            onReactionUpdate={handleReactionUpdate}
            onMessageUpdate={handleMessageUpdate}
            selectedMessage={selectedMessage}
            onSelectMessage={setSelectedMessage}
            isLoading={!isLoaded || loading}
          />
        </div>
      </div>

      {selectedMessage && (
        <div className="w-[400px] border-l border-gray-300">
          <ThreadWindow
            parentMessage={messages.find(m => m.id === selectedMessage.id) || selectedMessage}
            replies={selectedMessage.replies || []}
            currentUserId={userId || ''}
            onSendReply={async (content) => {
              const newReply = {
                id: Math.random().toString(),
                content,
                userId: userId || '',
                userName: messages.find(m => m.userId === userId)?.userName || '',
                createdAt: new Date().toISOString(),
                reactions: {}
              };
              handleMessageUpdate(selectedMessage.id, {
                replies: [...(selectedMessage.replies || []), newReply]
              });
            }}
            onReactionUpdate={handleReactionUpdate}
            onClose={() => setSelectedMessage(null)}
          />
        </div>
      )}
    </div>
  );
}
