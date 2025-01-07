import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hash, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Channel = {
  id: string;
  name: string;
}

type ChannelListProps = {
  channels: Channel[];
  onSelectChannel: (channelId: string) => void;
  onAddChannel?: (name: string) => void;
}

export function ChannelList({ channels, onSelectChannel, onAddChannel }: ChannelListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChannelName.trim()) {
      setError("hey, there's nothing in the text box, don't you try and get away with that");
      return;
    }

    if (channels.some(channel => channel.name.toLowerCase() === newChannelName.trim().toLowerCase())) {
      setError("we already have a channel with that name young man");
      return;
    }

    if (channels.length >= 10) {
      setError("Maximum of 10 channels allowed");
      return;
    }

    onAddChannel?.(newChannelName.trim());
    setNewChannelName("");
    setError(null);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Channels</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="rounded-full px-3 py-1 h-7"
          disabled={channels.length >= 10}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Channel
        </Button>
      </div>

      {channels.map((channel) => (
        <Button
          key={channel.id}
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onSelectChannel(channel.id)}
        >
          <Hash className="h-4 w-4 mr-2" />
          {channel.name}
        </Button>
      ))}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter channel name"
                value={newChannelName}
                onChange={(e) => {
                  setNewChannelName(e.target.value);
                  setError(null);
                }}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create Channel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

