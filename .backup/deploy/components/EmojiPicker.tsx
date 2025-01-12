'use client';

import { useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-10 h-10 p-0"
        >
          {value || '😀'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-none" side="right">
        <Picker
          data={data}
          onEmojiSelect={(emoji: { native: string }) => {
            onChange(emoji.native);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
} 