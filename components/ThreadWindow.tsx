import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { cn } from "@/lib/utils";
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
};

interface ThreadWindowProps {
  parentMessage: Message;
  replies: Message[];
  currentUserId: string;
  onSendReply: (content: string) => Promise<void>;
  onReactionUpdate: (messageId: string, updatedReactions: Message['reactions']) => void;
  onClose: () => void;
}

export function ThreadWindow({
  parentMessage,
  replies,
  currentUserId,
  onSendReply,
  onReactionUpdate,
  onClose,
}: ThreadWindowProps) {
  const [newReply, setNewReply] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    // If replying to a specific reply, add @username
    const replyContent = replyingTo 
      ? `@${replyingTo.userName} ${newReply}`
      : newReply;

    await onSendReply(replyContent);
    setNewReply(""); // Clear input after sending
    setReplyingTo(null); // Clear replyingTo state
  };

  const handleReactionSelect = async (messageId: string, emoji: string) => {
    const message = messageId === parentMessage.id ? parentMessage : replies.find(r => r.id === messageId);
    if (!message) return;

    const existingReaction = message.reactions[emoji];
    const updatedReactions = { ...message.reactions };
    
    if (existingReaction) {
      // Toggle user's reaction
      const userIndex = existingReaction.userIds.indexOf(currentUserId);
      if (userIndex >= 0) {
        updatedReactions[emoji] = {
          ...existingReaction,
          userIds: existingReaction.userIds.filter(id => id !== currentUserId)
        };
        // Remove reaction if no users left
        if (updatedReactions[emoji].userIds.length === 0) {
          delete updatedReactions[emoji];
        }
      } else {
        updatedReactions[emoji] = {
          ...existingReaction,
          userIds: [...existingReaction.userIds, currentUserId]
        };
      }
    } else {
      // Add new reaction
      updatedReactions[emoji] = {
        emoji,
        userIds: [currentUserId]
      };
    }

    // Update through parent component
    await onReactionUpdate(messageId, updatedReactions);
  };

  const renderMessage = (message: Message, isParent: boolean = false) => {
    const isCurrentUser = message.userId === currentUserId;

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
            <div className="flex items-start gap-2">
              {isCurrentUser && (
                <MessageReactions
                  messageId={message.id}
                  currentUserId={currentUserId}
                  onReactionSelect={handleReactionSelect}
                  align="start"
                />
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 text-sm break-words group cursor-pointer",
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
              {!isCurrentUser && (
                <MessageReactions
                  messageId={message.id}
                  currentUserId={currentUserId}
                  onReactionSelect={handleReactionSelect}
                  align="end"
                />
              )}
            </div>
          </div>
        </div>
        {Object.entries(message.reactions).length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 max-w-[calc(100%-3rem)]",
            isCurrentUser ? "self-end" : "self-start"
          )}>
            {Object.entries(message.reactions).map(([emoji, reaction]) => (
              <button
                key={emoji}
                onClick={() => handleReactionSelect(message.id, emoji)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-sm",
                  "border-2 border-black hover:bg-white/50 transition-colors",
                  reaction.userIds.includes(currentUserId) && "bg-white/50"
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
  };

  return (
    <div className="flex flex-col h-full bg-[#D5C6B3]">
      <div className="p-4 border-b bg-[#223344] text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">Thread</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onClose();
            setReplyingTo(null);
          }}
          className="hover:bg-[#334455] text-white"
          aria-label="Close thread"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderMessage(parentMessage, true)}
        {replies.map((reply) => renderMessage(reply))}
      </div>
      <div className="sticky bottom-0 border-t border-gray-300 bg-[#D5C6B3] px-4 py-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {replyingTo && (
            <div className="text-sm text-gray-600 flex justify-between items-center px-2">
              <span>Replying to {replyingTo.userName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder={replyingTo ? `Reply to ${replyingTo.userName}...` : "Reply in thread..."}
              className="flex-1 bg-white/75"
            />
            <Button type="submit" size="icon" className="bg-[#6F8FAF] hover:bg-[#5A7593]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 