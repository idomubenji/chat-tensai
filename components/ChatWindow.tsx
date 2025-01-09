import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { MessageReactions } from "./MessageReactions";
import { MessageReplyButton } from "./MessageReplyButton";
import { ThreadWindow } from "./ThreadWindow";
import { LoadingBall } from "./LoadingBall";
import { UserName } from "./UserName";

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
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onReactionUpdate: (messageId: string, updatedReactions: Message['reactions']) => void;
  onMessageUpdate?: (messageId: string, updates: Partial<Message>) => void;
  selectedMessage: Message | null;
  onSelectMessage: (message: Message | null) => void;
  isLoading?: boolean;
}

export function ChatWindow({
  channelId,
  messages,
  onSendMessage,
  onReactionUpdate,
  onMessageUpdate,
  selectedMessage,
  onSelectMessage,
  isLoading = false,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();

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
      onSelectMessage(latestMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await onSendMessage(newMessage);
    setNewMessage(""); // Clear input after sending
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

      // Update through parent component
      onReactionUpdate(messageId, updatedReactions);

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

  if (isLoading || isTransitioning) {
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
              {Object.entries(message.reactions).length > 0 && (
                <div className={cn(
                  "flex flex-wrap gap-1",
                  isCurrentUser ? "self-end" : "self-start"
                )}>
                  {Object.entries(message.reactions).map(([emoji, reaction]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReactionSelect(message.id, emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-sm",
                        "border-2 border-black hover:bg-white/50 transition-colors",
                        reaction.userIds.includes(userId || '') && "bg-white/50"
                      )}
                    >
                      <span>{emoji}</span>
                      {reaction.userIds.length > 1 && (
                        <span className="text-xs text-gray-600">{reaction.userIds.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
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
