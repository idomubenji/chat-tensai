import { Button } from "@/components/ui/button";
import { MessageSquareShare } from "lucide-react";

interface MessageReplyButtonProps {
  onClick: () => void;
  align?: 'start' | 'end';
}

export function MessageReplyButton({
  onClick,
  align = 'start'
}: MessageReplyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="rounded-full w-8 h-8 p-0 hover:bg-gray-100"
      onClick={onClick}
      title="Reply 😏😏"
    >
      <MessageSquareShare className="h-4 w-4 text-gray-500" />
    </Button>
  );
} 