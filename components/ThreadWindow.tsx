import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { MessageReplyButton } from "./MessageReplyButton";
import { cn } from "@/lib/utils";
import { UserName } from "./UserName";
import { ProfilePicture } from "./ProfilePicture";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { Message } from '@/types/message';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ThreadWindowProps {
  messageId: string;
  onClose: () => void;
}

export function ThreadWindow({
  messageId,
  onClose,
}: ThreadWindowProps) {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [parentMessage, setParentMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<Message[]>([]);
  const { userId } = useSupabaseAuth();
  const supabase = createClientComponentClient<Database>();

  // Fetch parent message and replies
  useEffect(() => {
    const fetchMessages = async () => {
      const { data: message, error: messageError } = await supabase
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

      if (messageError) {
        console.error('Error fetching parent message:', messageError);
        return;
      }

      const transformedMessage: Message = {
        id: message.id,
        content: message.content,
        channel_id: message.channel_id,
        user_id: message.user_id,
        created_at: message.created_at,
        updated_at: message.updated_at,
        user: {
          id: message.user.id,
          name: message.user.name,
          avatar_url: message.user.avatar_url,
          role: message.user.role
        },
        reactions: message.reactions.reduce((acc: any, reaction: any) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              emoji: reaction.emoji,
              userIds: [],
              users: []
            };
          }
          acc[reaction.emoji].userIds.push(reaction.user_id);
          if (reaction.user) {
            acc[reaction.emoji].users.push({
              name: reaction.user.name
            });
          }
          return acc;
        }, {}),
        replies: []
      };

      setParentMessage(transformedMessage);

      // Fetch replies
      const { data: replyMessages, error: repliesError } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(*),
          reactions:message_reactions(
            *,
            user:users(*)
          )
        `)
        .eq('parent_id', messageId)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
        return;
      }

      const transformedReplies = replyMessages.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        channel_id: reply.channel_id,
        user_id: reply.user_id,
        created_at: reply.created_at,
        updated_at: reply.updated_at,
        user: {
          id: reply.user.id,
          name: reply.user.name,
          avatar_url: reply.user.avatar_url,
          role: reply.user.role
        },
        reactions: reply.reactions.reduce((acc: any, reaction: any) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              emoji: reaction.emoji,
              userIds: [],
              users: []
            };
          }
          acc[reaction.emoji].userIds.push(reaction.user_id);
          if (reaction.user) {
            acc[reaction.emoji].users.push({
              name: reaction.user.name
            });
          }
          return acc;
        }, {}),
        replies: []
      }));

      setReplies(transformedReplies);
    };

    fetchMessages();
  }, [messageId, supabase]);

  // Subscribe to new replies
  useEffect(() => {
    const channel = supabase.channel(`thread:${messageId}`);

    channel
      .on<Database['public']['Tables']['messages']['Row']>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `parent_id=eq.${messageId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: message, error } = await supabase
              .from('messages')
              .select(`
                *,
                user:users(*),
                reactions:message_reactions(
                  *,
                  user:users(*)
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching new reply:', error);
              return;
            }

            const transformedMessage: Message = {
              id: message.id,
              content: message.content,
              channel_id: message.channel_id,
              user_id: message.user_id,
              created_at: message.created_at,
              updated_at: message.updated_at,
              user: {
                id: message.user.id,
                name: message.user.name,
                avatar_url: message.user.avatar_url,
                role: message.user.role
              },
              reactions: message.reactions.reduce((acc: any, reaction: any) => {
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    userIds: [],
                    users: []
                  };
                }
                acc[reaction.emoji].userIds.push(reaction.user_id);
                if (reaction.user) {
                  acc[reaction.emoji].users.push({
                    name: reaction.user.name
                  });
                }
                return acc;
              }, {}),
              replies: []
            };

            setReplies(prev => [...prev, transformedMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [messageId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/channels/${parentMessage?.channel_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          parent_id: messageId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleReactionSelect = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/channels/${parentMessage?.channel_id}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      const reactions = await response.json();

      // Update reactions in state
      if (messageId === parentMessage?.id) {
        setParentMessage(prev => prev ? {
          ...prev,
          reactions: reactions.reduce((acc: any, reaction: any) => {
            if (!acc[reaction.emoji]) {
              acc[reaction.emoji] = {
                emoji: reaction.emoji,
                userIds: [],
                users: []
              };
            }
            acc[reaction.emoji].userIds.push(reaction.user_id);
            if (reaction.user) {
              acc[reaction.emoji].users.push({
                name: reaction.user.name
              });
            }
            return acc;
          }, {})
        } : null);
      } else {
        setReplies(prev => prev.map(reply => {
          if (reply.id === messageId) {
            return {
              ...reply,
              reactions: reactions.reduce((acc: any, reaction: any) => {
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    userIds: [],
                    users: []
                  };
                }
                acc[reaction.emoji].userIds.push(reaction.user_id);
                if (reaction.user) {
                  acc[reaction.emoji].users.push({
                    name: reaction.user.name
                  });
                }
                return acc;
              }, {})
            };
          }
          return reply;
        }));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [parentMessage]);

  const renderMessage = (message: Message, isParent: boolean = false) => {
    const isCurrentUser = message.user_id === userId;

    return (
      <div
        key={message.id}
        className={cn(
          "group flex flex-col gap-1",
          isCurrentUser ? "items-end" : "items-start",
          isParent && "border-b pb-4 mb-4"
        )}
      >
        <div className={cn("flex items-start gap-2 w-full", isCurrentUser ? "flex-row-reverse justify-start" : "flex-row")}>
          <div className={cn("flex flex-col min-w-0 max-w-[calc(100%-3rem)]", isCurrentUser ? "items-end" : "items-start")}>
            <div className="flex items-center gap-2">
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
            <div className="flex flex-col gap-1">
              <div className={cn(
                "flex items-start gap-2",
                isCurrentUser && "flex-row-reverse"
              )}>
                <div className="w-8 h-8 flex-shrink-0">
                  <ProfilePicture
                    size="default"
                    borderColor={isCurrentUser ? "black" : "white"}
                    borderWidth="thin"
                    shouldFetch={false}
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
                  onClick={() => !isParent && setReplyingTo(message)}
                >
                  {message.content}
                  {replyingTo?.id === message.id && (
                    <div className="text-xs text-blue-500 mt-1">Replying to this message</div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isCurrentUser && (
                    <MessageReplyButton
                      onClick={() => !isParent && setReplyingTo(message)}
                      align="start"
                    />
                  )}
                  <MessageReactions
                    messageId={message.id}
                    currentUserId={userId || ''}
                    onReactionSelect={handleReactionSelect}
                    align={isCurrentUser ? "start" : "end"}
                    reactions={message.reactions}
                    showButton
                  />
                  {!isCurrentUser && (
                    <MessageReplyButton
                      onClick={() => !isParent && setReplyingTo(message)}
                      align="end"
                    />
                  )}
                </div>
              </div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Thread</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {parentMessage && renderMessage(parentMessage, true)}
        {replies.map(reply => renderMessage(reply))}
      </div>

      <div className="sticky bottom-0 border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Reply${replyingTo ? ` to ${replyingTo.user.name}` : ''}...`}
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
} 