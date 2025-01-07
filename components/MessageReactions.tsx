import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
  onReactionSelect: (messageId: string, emoji: string) => Promise<void>;
  align?: 'start' | 'end';
}

export function MessageReactions({
  messageId,
  currentUserId,
  onReactionSelect,
  align = 'start'
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiSelect = async (emoji: any) => {
    if (emoji.native) {
      await onReactionSelect(messageId, emoji.native);
      setIsOpen(false);
    }
  };

  return (
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
  );
} 