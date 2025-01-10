import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
  onReactionSelect: (messageId: string, emoji: string) => Promise<void>;
  align?: 'start' | 'end';
  reactions?: {
    [key: string]: {
      emoji: string;
      userIds: string[];
      users?: { name: string }[];
    };
  };
}

export function MessageReactions({
  messageId,
  currentUserId,
  onReactionSelect,
  align = 'start',
  reactions = {}
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticReactions, setOptimisticReactions] = useState(reactions);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const handleEmojiSelect = async (emoji: any) => {
    if (!emoji.native) return;
    
    // Optimistically update the local state
    const emojiKey = emoji.native;
    const existingReaction = optimisticReactions[emojiKey];
    const updatedReactions = { ...optimisticReactions };
    
    if (existingReaction?.userIds.includes(currentUserId)) {
      // Remove reaction
      updatedReactions[emojiKey] = {
        ...existingReaction,
        userIds: existingReaction.userIds.filter(id => id !== currentUserId)
      };
      if (updatedReactions[emojiKey].userIds.length === 0) {
        delete updatedReactions[emojiKey];
      }
    } else {
      // Add reaction
      updatedReactions[emojiKey] = {
        emoji: emojiKey,
        userIds: [...(existingReaction?.userIds || []), currentUserId],
        users: [...(existingReaction?.users || [])]
      };
    }
    
    setOptimisticReactions(updatedReactions);
    setIsOpen(false);

    try {
      if (existingReaction?.userIds.includes(currentUserId)) {
        // Remove reaction from Supabase
        const { error: deleteError } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUserId)
          .eq('emoji', emojiKey);

        if (deleteError) throw deleteError;
      } else {
        // Add reaction to Supabase
        const { error: insertError } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            emoji: emojiKey
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticReactions(reactions);
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderReactions = () => {
    return Object.entries(optimisticReactions).map(([emoji, reaction]) => (
      <TooltipProvider key={emoji}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleEmojiSelect({ native: emoji })}
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
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              {reaction.users
                ? reaction.users.map(u => u.name).join(", ")
                : `${reaction.userIds.length} ${reaction.userIds.length === 1 ? 'user' : 'users'}`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full w-8 h-8 p-0 hover:bg-gray-100"
              title="Add reaction"
            >
              <Smile className="h-4 w-4 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-full p-0 border-none shadow-lg" 
            align={align}
            sideOffset={5}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
            />
          </PopoverContent>
        </Popover>
      </div>
      {Object.keys(optimisticReactions).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {renderReactions()}
        </div>
      )}
    </div>
  );
} 