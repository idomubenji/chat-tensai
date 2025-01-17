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
  const [currentMentionedUser, setCurrentMentionedUser] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user, userId } = useSupabaseAuth();
  const tensaiClient = new TensaiClient();
  const isNearBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);
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

  // Handle scrolling behavior
  useEffect(() => {
    if (!messages.length) return;

    requestAnimationFrame(() => {
      const scrollToBottom = () => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: isInitialLoadRef.current ? 'auto' : 'smooth',
            block: 'end'
          });
        }
      };

      if (isInitialLoadRef.current && !isLoading) {
        // Initial load: instant scroll to bottom
        scrollToBottom();
        isInitialLoadRef.current = false;
      } else if (!isLoading) {
        // Only scroll for own messages or if near bottom
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.userId === userId || isNearBottomRef.current) {
          scrollToBottom();
        }
      }
    });
  }, [messages, isLoading, userId]);

  // Extract mentioned username from message and handle @AI reset
  const extractMentionedUser = (message: string): string | undefined => {
    const match = message.match(/@(\w+)/);
    if (!match) return currentMentionedUser; // Keep current target if no new mention

    const mentionedUser = match[1];
    if (mentionedUser.toLowerCase() === 'ai') {
      return undefined; // Reset to TENSAI BOT
    }
    return mentionedUser;
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

    // Add optimistic message and scroll to bottom
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Force scroll to bottom after adding user message
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    try {
      const newMentionedUser = extractMentionedUser(inputText);
      setCurrentMentionedUser(newMentionedUser); // Update the current target
      const response = await tensaiClient.sendMessage(inputText, newMentionedUser);

      // Debug log to see API response
      console.log('API Response:', {
        content: response.response,
        username: response.metadata.username,
        avatarUrl: response.metadata.avatarUrl,
        fullResponse: response
      });

      const aiMessage: TensaiMessage = {
        id: `ai-${Date.now()}`,
        content: response.response,
        username: newMentionedUser ? `FAKE ${response.metadata.username}` : 'TENSAI BOT',
        userId: 'ai',
        avatarUrl: response.metadata.avatarUrl,
        isAi: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Force scroll to bottom after AI response
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
      
      // Force scroll to bottom after error message
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0"
        onScroll={() => {
          isNearBottomRef.current = checkIfNearBottom();
        }}
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
                      borderColor={isCurrentUser ? 'black' : 'black'}
                      borderWidth={isCurrentUser ? 'thin' : 'thick'}
                      avatarUrl={message.avatarUrl}
                      className={cn(
                        !isCurrentUser && '[&_img]:!rounded-none [&_div]:!rounded-none [&_div]:!border-[6px]'
                      )}
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

      <form onSubmit={handleSubmit} className="sticky bottom-0 p-4 bg-black/20">
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