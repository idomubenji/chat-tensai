import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';
import { MessageReactions } from './MessageReactions';
import { MessageReplyButton } from './MessageReplyButton';
import { cn } from '@/lib/utils';
import { UserName } from './UserName';
import { ProfilePicture } from './ProfilePicture';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
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
  const [newMessage, setNewMessage] = useState('');
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
        replies: { count: 0 }
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
        reactions: (reply.reactions || []).reduce((acc: any, reaction: any) => {
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
        replies: { count: 0 }
      }));

      setReplies(transformedReplies);
    };

    fetchMessages();
  }, [messageId, supabase]);

  // Subscribe to new replies
  useEffect(() => {
    const channel = supabase.channel(`thread:${messageId}`);

    type ReactionRecord = Database['public']['Tables']['message_reactions']['Row'];
    
    const isReactionRecord = (record: any): record is ReactionRecord => {
      return record && typeof record.message_id === 'string';
    };

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
              replies: { count: 0 }
            };

            setReplies(prev => [...prev, transformedMessage]);
          }
        }
      )
      .subscribe();

    // Subscribe to reaction changes for parent message and replies
    const reactionChannel = supabase.channel(`thread-reactions:${messageId}`);

    reactionChannel
      .on<ReactionRecord>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        async (payload: RealtimePostgresChangesPayload<ReactionRecord>) => {
          const record = payload.new || payload.old;
          if (!isReactionRecord(record)) return;

          // Fetch updated parent message reactions
          const { data: message } = await supabase
            .from('messages')
            .select(`
              reactions:message_reactions(
                *,
                user:users(*)
              )
            `)
            .eq('id', messageId)
            .single();

          if (!message?.reactions) return;

          const updatedReactions = message.reactions.reduce((acc: any, reaction: any) => {
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
          }, {});

          setParentMessage(prev => prev ? {
            ...prev,
            reactions: updatedReactions
          } : null);
        }
      )
      .subscribe();

    // Subscribe to reaction changes for replies
    const repliesReactionChannel = supabase.channel(`thread-replies-reactions:${messageId}`);

    repliesReactionChannel
      .on<ReactionRecord>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=in.(${replies.map(r => r.id).join(',')})`,
        },
        async (payload: RealtimePostgresChangesPayload<ReactionRecord>) => {
          const record = payload.new || payload.old;
          if (!isReactionRecord(record)) return;

          // Fetch updated message reactions
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

          const updatedReactions = message.reactions.reduce((acc: any, reaction: any) => {
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
          }, {});

          setReplies(prev => 
            prev.map(reply => 
              reply.id === record.message_id ? {
                ...reply,
                reactions: updatedReactions
              } : reply
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      reactionChannel.unsubscribe();
      repliesReactionChannel.unsubscribe();
    };
  }, [messageId, supabase, replies]);

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
      const message = messageId === parentMessage?.id ? parentMessage : replies.find(r => r.id === messageId);
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
      if (messageId === parentMessage?.id) {
        setParentMessage(prev => prev ? {
          ...prev,
          reactions: updatedReactions
        } : null);
      } else {
        setReplies(prev => prev.map(reply => 
          reply.id === messageId
            ? { ...reply, reactions: updatedReactions }
            : reply
        ));
      }

      // Send update to server
      const response = await fetch(`/api/channels/${message.channel_id}/messages/${messageId}/reactions`, {
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

      // Real-time subscription will handle syncing the final state
    } catch (error) {
      console.error('Error updating reaction:', error);
      // Revert optimistic update on error by refetching the message
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

        if (messageId === parentMessage?.id) {
          setParentMessage(prev => prev ? {
            ...prev,
            reactions: formattedReactions
          } : null);
        } else {
          setReplies(prev => prev.map(reply => 
            reply.id === messageId
              ? { ...reply, reactions: formattedReactions }
              : reply
          ));
        }
      }
    }
  }, [parentMessage, replies, userId, supabase]);

  const renderMessage = (message: Message, isParent: boolean = false) => {
    const isCurrentUser = message.user_id === userId;

    return (
      <div
        key={message.id}
        className={cn(
          'group flex flex-col gap-1',
          isCurrentUser ? 'items-end' : 'items-start',
          isParent && 'border-b pb-4 mb-4'
        )}
      >
        <div className={cn('flex items-start gap-2 w-full', isCurrentUser ? 'flex-row-reverse justify-start' : 'flex-row')}>
          <div className={cn('flex flex-col min-w-0 max-w-[calc(100%-3rem)]', isCurrentUser ? 'items-end' : 'items-start')}>
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
                'flex items-start gap-2',
                isCurrentUser && 'flex-row-reverse'
              )}>
                <div className="w-8 h-8 flex-shrink-0">
                  <ProfilePicture
                    size="default"
                    borderColor={isCurrentUser ? 'black' : 'white'}
                    borderWidth="thin"
                    avatarUrl={message.user.avatar_url}
                  />
                </div>
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm break-words',
                    isCurrentUser
                      ? 'bg-pink-200 text-gray-900'
                      : 'bg-[#223344] text-white'
                  )}
                >
                  {message.content}
                </div>
                <div className="flex items-center gap-1">
                  <MessageReactions
                    messageId={message.id}
                    currentUserId={userId || ''}
                    onReactionSelect={handleReactionSelect}
                    align={isCurrentUser ? 'start' : 'end'}
                    reactions={message.reactions}
                    showButton
                  />
                </div>
              </div>
              {Object.keys(message.reactions).length > 0 && (
                <div className={cn(
                  'flex flex-wrap gap-1 mt-1',
                  isCurrentUser ? 'pr-12' : 'pl-12'
                )}>
                  <MessageReactions
                    messageId={message.id}
                    currentUserId={userId || ''}
                    onReactionSelect={handleReactionSelect}
                    align={isCurrentUser ? 'start' : 'end'}
                    reactions={message.reactions}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#D5C6B3] border-l-2 border-l-black">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#E0D6C3]">
        <h2 className="text-lg font-semibold">Thread</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {parentMessage && renderMessage(parentMessage, true)}
        {replies.map(reply => renderMessage(reply))}
      </div>

      <div className="sticky bottom-0 border-t border-gray-200 bg-[#E0D6C3] p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Reply${replyingTo ? ` to ${replyingTo.user.name}` : ''}...`}
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