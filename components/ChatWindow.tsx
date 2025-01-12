import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Smile } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { cn } from "@/lib/utils";
import { MessageReactions } from "./MessageReactions";
import { MessageReplyButton } from "./MessageReplyButton";
import { ThreadWindow } from "./ThreadWindow";
import { LoadingBall } from "./LoadingBall";
import { UserName } from "./UserName";
import { ProfilePicture } from "./ProfilePicture";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import type { Message } from "@/types/message";
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  const { userId, user } = useSupabaseAuth();

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
      user_id: userId || '',
      channel_id: channelId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: userId || '',
        name: 'You',
        avatar_url: user?.user_metadata?.avatar_url || null,
        role: user?.role || 'USER'
      },
      reactions: {},
      replies: { count: 0 }
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
      const action = existingReaction?.userIds.includes(userId || '') ? 'remove' : 'add';

      // Apply optimistic update
      const updatedReactions = { ...message.reactions };
      if (action === 'add') {
        if (!updatedReactions[emoji]) {
          updatedReactions[emoji] = {
            emoji,
            userIds: [],
            users: []
          };
        }
        updatedReactions[emoji] = {
          ...updatedReactions[emoji],
          userIds: [...(updatedReactions[emoji]?.userIds || []), userId || ''],
          users: [...(updatedReactions[emoji]?.users || []), { name: 'You' }]
        };
      } else {
        if (updatedReactions[emoji]) {
          const reaction = updatedReactions[emoji];
          if (!reaction) return;
          
          updatedReactions[emoji] = {
            ...reaction,
            userIds: reaction.userIds?.filter(id => id !== userId) || [],
            users: reaction.users?.filter(u => u.name !== 'You') || []
          };
          if (updatedReactions[emoji].userIds.length === 0) {
            delete updatedReactions[emoji];
          }
        }
      }

      // Update state optimistically
      handleReactionUpdate(messageId, updatedReactions);

      // Send update to server
      const response = await fetch(`/api/channels/${channelId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          emoji,
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Revert optimistic update on error by refetching the message
      const supabase = createClientComponentClient<Database>();
      const { data: message } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(*),
          reactions:message_reactions(
            *,
            user:users(*)
          )
        `)
        .eq('id', messageId)
        .single();

      if (message) {
        const formattedReactions = message.reactions.reduce((acc: any, reaction: any) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              emoji: reaction.emoji,
              userIds: [],
              users: []
            };
          }
          acc[reaction.emoji].userIds.push(reaction.user_id);
          if (reaction.user) {
            acc[reaction.emoji].users.push({ name: reaction.user.name });
          }
          return acc;
        }, {});

        handleReactionUpdate(messageId, formattedReactions);
      }
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
    const messageIds = messages.map(message => message.id).filter(Boolean);
    
    if (messageIds.length === 0) return;

    type ReactionRecord = Database['public']['Tables']['message_reactions']['Row'];
    
    const isReactionRecord = (record: any): record is ReactionRecord => {
      return record && typeof record.message_id === 'string';
    };

    // Create a single channel for all message reactions
    const channel = supabase
      .channel(`message-reactions-${channelId}`)
      .on<ReactionRecord>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=in.(${messageIds.join(',')})`,
        },
        async (payload: RealtimePostgresChangesPayload<ReactionRecord>) => {
          const record = payload.new || payload.old;
          if (!isReactionRecord(record)) return;

          // Fetch all reactions for this message
          const { data: message } = await supabase
            .from('messages')
            .select(`
              reactions:message_reactions(
                *,
                user:users(*)
              )
            `)
            .eq('id', record.message_id)
            .single();

          if (!message?.reactions) return;

          // Transform reactions into the expected format
          const formattedReactions = message.reactions.reduce((acc: {
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

          handleReactionUpdate(record.message_id, formattedReactions);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
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
        
        // Debug log
        console.log('Raw messages:', messages);
        
        // Transform the messages to match our expected format
        const transformedMessages = messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          channel_id: msg.channel_id,
          user_id: msg.user_id,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          user: {
            id: msg.user.id,
            name: msg.user.name,
            avatar_url: msg.user.avatar_url,
            role: msg.user.role
          },
          reactions: (msg.reactions || []).reduce((acc: any, reaction: any) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = {
                emoji: reaction.emoji,
                userIds: [],
                users: []
              };
            }
            acc[reaction.emoji].userIds.push(reaction.user_id);
            if (reaction.user) {
              acc[reaction.emoji].users.push({ name: reaction.user.name });
            }
            return acc;
          }, {}),
          replies: {
            count: msg.replies?.count || 0
          }
        }));

        // Debug log
        console.log('Transformed messages:', {
          count: transformedMessages.length,
          firstMessage: transformedMessages[0],
          replyCount: transformedMessages[0]?.replies?.count
        });

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
              channel_id: msg.channel_id,
              user_id: msg.user_id,
              created_at: msg.created_at,
              updated_at: msg.updated_at,
              user: {
                id: msg.user.id,
                name: msg.user.name,
                avatar_url: msg.user.avatar_url,
                role: msg.user.role
              },
              reactions: (msg.reactions || []).reduce((acc: any, reaction: any) => {
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    userIds: [],
                    users: []
                  };
                }
                acc[reaction.emoji].userIds.push(reaction.user_id);
                if (reaction.user) {
                  acc[reaction.emoji].users.push({ name: reaction.user.name });
                }
                return acc;
              }, {}),
              replies: {
                count: msg.replies?.count || 0
              }
            }));

            // Debug log for real-time updates
            console.log('Real-time transformed messages:', {
              count: transformedMessages.length,
              firstMessage: transformedMessages[0],
              replyCount: transformedMessages[0]?.replies?.count
            });

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
          const isCurrentUser = message.user_id === userId;
          console.log('Message replies:', {
            messageId: message.id,
            replyCount: message.replies?.count,
            fullReplies: message.replies
          });

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
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <UserName
                        name={message.user.name}
                        userId={message.user.id}
                        role={message.user.role}
                      />
                    </>
                  ) : (
                    <>
                      <UserName
                        name={message.user.name}
                        userId={message.user.id}
                        role={message.user.role}
                      />
                      <span className="text-xs text-gray-600">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
                <div className={cn(
                  "flex items-start gap-2",
                  isCurrentUser && "flex-row-reverse"
                )}>
                  <div className="w-8 h-8 flex-shrink-0">
                    <ProfilePicture
                      size="default"
                      borderColor={isCurrentUser ? "black" : "white"}
                      borderWidth="thin"
                      avatarUrl={message.user.avatar_url}
                    />
                  </div>
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
                      showButton
                    />
                    <MessageReplyButton
                      onClick={() => handleSelectMessage(message)}
                      align={isCurrentUser ? "start" : "end"}
                    />
                  </div>
                </div>
                {message.replies && message.replies.count > 0 && (
                  <div
                    onClick={() => handleSelectMessage(message)}
                    className={cn(
                      "text-sm text-blue-500 hover:underline cursor-pointer mt-1",
                      isCurrentUser ? "pr-12" : "pl-12"
                    )}
                  >
                    {message.replies.count} {message.replies.count === 1 ? 'reply' : 'replies'}
                  </div>
                )}
                {Object.keys(message.reactions).length > 0 && (
                  <div className={cn(
                    "flex flex-wrap gap-1 mt-1",
                    isCurrentUser ? "pr-12" : "pl-12"
                  )}>
                    <MessageReactions
                      messageId={message.id}
                      currentUserId={userId || ''}
                      onReactionSelect={handleReactionSelect}
                      align={isCurrentUser ? "start" : "end"}
                      reactions={message.reactions}
                    />
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
