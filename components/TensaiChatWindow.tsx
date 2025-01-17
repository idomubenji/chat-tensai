'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { ProfilePicture } from '@/components/ProfilePicture';
import { UserName } from '@/components/UserName';
import { TensaiClient } from '@/utils/api-client';
import { LoadingBall } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface TensaiMessage {
  id: string;
  content: string;
  username: string;
  avatarUrl: string | null;
  isAi: boolean;
  timestamp: string;
  userId: string;
}

export function TensaiChatWindow() {
  const [messages, setMessages] = useState<TensaiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<{ name: string; avatar_url: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user, userId } = useSupabaseAuth();
  const tensaiClient = new TensaiClient();
  const isNearBottomRef = useRef(true);
  const supabase = createClientComponentClient<Database>();

  // Fetch user data from Supabase
  useEffect(() => {
    async function fetchUserData() {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      setUserData(data);
    }

    fetchUserData();
  }, [userId, supabase]);

  // Debug user data
  useEffect(() => {
    console.log('User data:', {
      userData,
      userId
    });
  }, [userData, userId]);

  // Check if user is near bottom of chat
  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;

    const threshold = 100; // pixels from bottom to consider "near bottom"
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  }, []);

  // Update isNearBottomRef when user scrolls
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isNearBottomRef.current = checkIfNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfNearBottom]);

  // Scroll to bottom for new messages if near bottom
  useEffect(() => {
    if (messages.length && isNearBottomRef.current) {
      const scrollIntoViewIfNeeded = () => {
        if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      };
      scrollIntoViewIfNeeded();
    }
  }, [messages]);

  // Extract mentioned username from message
  const extractMentionedUser = (message: string): string | undefined => {
    const match = message.match(/@(\w+)/);
    return match ? match[1] : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !userData) return;

    const userMessage: TensaiMessage = {
      id: `user-${Date.now()}`,
      content: inputText,
      username: userData.name,
      userId: user.id,
      avatarUrl: userData.avatar_url,
      isAi: false,
      timestamp: new Date().toISOString()
    };

    // Add optimistic message
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      return newMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
    setInputText('');
    setIsLoading(true);

    try {
      const mentionedUser = extractMentionedUser(inputText);
      const response = await tensaiClient.sendMessage(inputText, mentionedUser);

      const aiMessage: TensaiMessage = {
        id: `ai-${Date.now()}`,
        content: response.content,
        username: `${response.username}`,
        userId: 'ai',
        avatarUrl: response.avatarUrl,
        isAi: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => {
        const newMessages = [...prev, aiMessage];
        return newMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: TensaiMessage = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error while processing your request.',
        username: 'System',
        userId: 'system',
        avatarUrl: null,
        isAi: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.map((message) => {
          const isCurrentUser = message.userId === userId;

          return (
            <div
              key={message.id}
              className={cn(
                'group flex flex-col gap-1 w-full',
                isCurrentUser ? 'items-end' : 'items-start'
              )}
            >
              <div className={cn(
                'flex flex-col max-w-[70%]',
                isCurrentUser ? 'items-end' : 'items-start'
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {isCurrentUser ? (
                    <>
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <UserName
                        name={message.username}
                        userId={message.userId}
                        role={message.isAi ? 'AI' : 'USER'}
                        className="text-white"
                      />
                    </>
                  ) : (
                    <>
                      <UserName
                        name={message.username}
                        userId={message.userId}
                        role={message.isAi ? 'AI' : 'USER'}
                        className="text-white"
                      />
                      <span className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
                <div className={cn(
                  'flex items-start gap-2',
                  isCurrentUser && 'flex-row-reverse'
                )}>
                  <div className="w-8 h-8 flex-shrink-0">
                    <ProfilePicture
                      size="default"
                      borderColor={isCurrentUser ? 'black' : 'white'}
                      borderWidth="thin"
                      avatarUrl={message.avatarUrl}
                      className={message.isAi ? 'rounded-none' : 'rounded-full'}
                    />
                  </div>
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm break-words min-w-0',
                      isCurrentUser
                        ? 'bg-pink-200 text-gray-900'
                        : 'bg-[#223344] text-white'
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-center">
            <LoadingBall />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-black/20">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Button type="submit" variant="ghost" size="icon" disabled={isLoading}>
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </form>
    </div>
  );
} 