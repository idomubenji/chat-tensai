import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { cn } from "@/lib/utils";
import { MessageReactions } from "./MessageReactions";
import { MessageReplyButton } from "./MessageReplyButton";
import { ThreadWindow } from "./ThreadWindow";
import { LoadingBall } from "./LoadingBall";
import { UserName } from "./UserName";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useReactionSubscription } from '@/hooks/useReactionSubscription';

type Message = {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userRole?: string;
  createdAt: string;
  reactions: {
    [key: string]: {
      emoji: string;
      userIds: string[];
    };
  };
  replies?: Message[];
};

interface ChatWindowProps {
  channelId: string;
  onMessageSelect: (messageId: string) => void;
  selectedMessageId: string | null;
}

export function ChatWindow({
  channelId,
  onMessageSelect,
  selectedMessageId,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useSupabaseAuth();

  useEffect(() => {
    if (isLoading) {
      setIsTransitioning(false);
    } else {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500); // Match fade-out duration
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectMessage = (message: Message) => {
    const latestMessage = messages.find(m => m.id === message.id);
    if (latestMessage) {
      onMessageSelect(latestMessage.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      userId: userId || '',
      userName: 'You', // This will be updated when we fetch
      createdAt: new Date().toISOString(),
      reactions: {},
      replies: []
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage(""); // Clear input after sending

    try {
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      // Real message will come through the subscription
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  const handleReactionSelect = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const existingReaction = message.reactions[emoji];
      const updatedReactions = { ...message.reactions };
      
      if (existingReaction) {
        // Toggle user's reaction
        const userIndex = existingReaction.userIds.indexOf(userId || '');
        if (userIndex >= 0) {
          updatedReactions[emoji] = {
            ...existingReaction,
            userIds: existingReaction.userIds.filter(id => id !== userId)
          };
          // Remove reaction if no users left
          if (updatedReactions[emoji].userIds.length === 0) {
            delete updatedReactions[emoji];
          }
        } else {
          updatedReactions[emoji] = {
            ...existingReaction,
            userIds: [...existingReaction.userIds, userId || '']
          };
        }
      } else {
        // Add new reaction
        updatedReactions[emoji] = {
          emoji,
          userIds: [userId || '']
        };
      }

      // Send update to server
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messageId, 
          emoji,
          action: existingReaction?.userIds.includes(userId || '') ? 'remove' : 'add'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReactionUpdate = useCallback((messageId: string, newReactions: Message['reactions']) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId
          ? { ...msg, reactions: newReactions }
          : msg
      )
    );
  }, []);

  // Subscribe to reactions for all visible messages
  useEffect(() => {
    const supabase = createClientComponentClient<Database>();
    const messageIds = messages.map(message => message.id);
    
    if (messageIds.length === 0) return;

    type ReactionRecord = {
      message_id: string;
      user_id: string;
      emoji: string;
    };

    // Create a single channel for all message reactions
    const channel = supabase
      .channel(`message-reactions-${channelId}`)
      .on(
        'postgres_changes' as const,
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=in.(${messageIds.join(',')})`,
        },
        async (payload: RealtimePostgresChangesPayload<ReactionRecord>) => {
          const record = payload.new || payload.old;
          if (!record) return;

          const messageId = (record as ReactionRecord).message_id;
          if (!messageId) return;

          // Fetch all reactions for this message
          const { data: reactions } = await supabase
            .from('message_reactions')
            .select(`
              *,
              user:users(*)
            `)
            .eq('message_id', messageId);

          if (!reactions) return;

          // Transform reactions into the expected format
          const formattedReactions = reactions.reduce((acc: {
            [key: string]: {
              emoji: string;
              userIds: string[];
              users: { name: string }[];
            };
          }, reaction: any) => {
            const { emoji, user } = reaction;
            if (!acc[emoji]) {
              acc[emoji] = {
                emoji,
                userIds: [],
                users: []
              };
            }
            acc[emoji].userIds.push(reaction.user_id);
            if (user) {
              acc[emoji].users.push({ name: user.name });
            }
            return acc;
          }, {});

          handleReactionUpdate(messageId, formattedReactions);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messages, channelId, handleReactionUpdate]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/channels/${channelId}/messages`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const messages = await response.json();
        
        // Transform the messages to match our expected format
        const transformedMessages = messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          userId: msg.user_id,
          userName: msg.user?.name || 'Unknown User',
          userRole: msg.user?.role,
          createdAt: msg.created_at,
          reactions: (msg.reactions || []).reduce((acc: any, reaction: any) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = {
                emoji: reaction.emoji,
                userIds: []
              };
            }
            acc[reaction.emoji].userIds.push(reaction.user_id);
            return acc;
          }, {}),
          replies: [] // TODO: Implement replies
        }));

        setMessages(transformedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const supabase = createClientComponentClient<Database>();
    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async () => {
          // Don't show loading state for real-time updates
          try {
            const response = await fetch(`/api/channels/${channelId}/messages`);
            if (!response.ok) {
              throw new Error('Failed to fetch messages');
            }
            const messages = await response.json();
            
            const transformedMessages = messages.map((msg: any) => ({
              id: msg.id,
              content: msg.content,
              userId: msg.user_id,
              userName: msg.user?.name || 'Unknown User',
              userRole: msg.user?.role,
              createdAt: msg.created_at,
              reactions: (msg.reactions || []).reduce((acc: any, reaction: any) => {
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    userIds: []
                  };
                }
                acc[reaction.emoji].userIds.push(reaction.user_id);
                return acc;
              }, {}),
              replies: []
            }));

            // Remove any optimistic messages when setting new messages
            setMessages(transformedMessages);
          } catch (error) {
            console.error('Error fetching messages:', error);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId]);

  // Only show loading state when switching channels
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F5E6D3]">
        <div className={cn(
          "w-12 h-12 rounded-full",
          "bg-gradient-to-r from-yellow-300 to-purple-500",
          "shadow-[0_0_20px_rgba(252,211,77,0.7)]",
          "animate-glow",
          isTransitioning ? "animate-fade-out" : "animate-fade-in"
        )} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5E6D3]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.userId === userId;
          const replyCount = message.replies?.length || 0;

          return (
            <div
              key={message.id}
              className={cn(
                "group flex flex-col gap-1 w-full",
                isCurrentUser ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "flex flex-col max-w-[70%]",
                isCurrentUser ? "items-end" : "items-start"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {isCurrentUser ? (
                    <>
                      <span className="text-xs text-gray-600">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <UserName
                        name={message.userName}
                        userId={message.userId}
                        role={message.userRole}
                      />
                    </>
                  ) : (
                    <>
                      <UserName
                        name={message.userName}
                        userId={message.userId}
                        role={message.userRole}
                      />
                      <span className="text-xs text-gray-600">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
                <div className={cn(
                  "flex items-start gap-2",
                  isCurrentUser && "flex-row-reverse"
                )}>
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm break-words",
                      isCurrentUser
                        ? "bg-pink-200 text-gray-900"
                        : "bg-[#223344] text-white"
                    )}
                  >
                    {message.content}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1",
                    isCurrentUser && "flex-row-reverse"
                  )}>
                    <MessageReactions
                      messageId={message.id}
                      currentUserId={userId || ''}
                      onReactionSelect={handleReactionSelect}
                      align={isCurrentUser ? "start" : "end"}
                      reactions={message.reactions}
                    />
                    <MessageReplyButton
                      onClick={() => handleSelectMessage(message)}
                      align={isCurrentUser ? "start" : "end"}
                    />
                  </div>
                </div>
                {replyCount > 0 && (
                  <div
                    onClick={() => handleSelectMessage(message)}
                    className="text-sm text-blue-500 hover:underline mt-1 cursor-pointer"
                  >
                    View {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t border-gray-300 bg-[#F5E6D3] px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/75"
          />
          <Button type="submit" size="icon" className="bg-[#6F8FAF] hover:bg-[#5A7593]">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
