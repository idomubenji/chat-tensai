"use client";

import { useEffect, useState, useCallback } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThreadWindow } from "@/components/ThreadWindow";
import { useChannels } from "@/hooks/useChannels";
import type { Database } from '@/types/supabase';
import { Sidebar } from "@/components/Sidebar";

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
  const { channels, loading: channelsLoading } = useChannels();
  const channel = channels.find((c) => c.id === params.channelId);
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const fetchMessagesForChannel = useCallback(async (channelId: string) => {
    if (!userId) return;
    try {
      const response = await fetch(
        `/api/channels/${channelId}/messages`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Handle authentication
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  // Handle channel redirection and message fetching
  useEffect(() => {
    const handleChannelSetup = async () => {
      if (!channelsLoading && userId && channels.length > 0) {
        console.log('=== Channel Setup Start ===');
        console.log('Current channel ID:', params.channelId);
        console.log('Available channels:', channels);
        
        const currentChannel = channels.find(c => c.id === params.channelId);
        const generalChannel = channels.find(c => c.name === 'general');
        
        console.log('Current channel:', currentChannel);
        console.log('General channel:', generalChannel);

        if (!currentChannel && generalChannel) {
          console.log('Channel not found, redirecting to general channel:', generalChannel.id);
          await router.replace(`/channels/${generalChannel.id}`, { scroll: false });
        } else if (currentChannel) {
          console.log('Fetching messages for current channel');
          await fetchMessagesForChannel(currentChannel.id);
        }
        
        console.log('=== Channel Setup End ===');
      }
    };

    handleChannelSetup();
  }, [channelsLoading, userId, channels, params.channelId, router, fetchMessagesForChannel]);

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

  // Show loading state while fetching channels
  if (channelsLoading) {
    return <div className="flex h-screen items-center justify-center">Loading channels...</div>;
  }

  // Return loading state while redirecting
  if (!channel) {
    return <div className="flex h-screen items-center justify-center">Redirecting...</div>;
  }

  const handleReply = async (content: string) => {
    if (!selectedMessage) return;
    const newReply = {
      id: Math.random().toString(),
      content,
      userId,
      userName: messages.find(m => m.userId === userId)?.userName || 'Unknown User',
      createdAt: new Date().toISOString(),
      reactions: {}
    };
    handleMessageUpdate(selectedMessage.id, {
      replies: [...(selectedMessage.replies || []), newReply]
    });
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className={cn(
        "flex flex-col h-full flex-1",
        selectedMessage ? "w-[calc(100%-400px)]" : "w-full"
      )}>
        <div className="p-4 border-b bg-[#445566] text-white">
          <h1 className="text-2xl font-bold">
            {channel.name.startsWith('#') ? channel.name : `#${channel.name}`}
          </h1>
          {channel.description && (
            <p className="text-sm text-gray-300">{channel.description}</p>
          )}
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
            currentUserId={userId}
            onSendReply={handleReply}
            onReactionUpdate={handleReactionUpdate}
            onClose={() => setSelectedMessage(null)}
          />
        </div>
      )}
    </div>
  );
}
