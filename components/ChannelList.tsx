import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hash, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Channel = {
  id: string;
  name: string;
}

type ChannelListProps = {
  channels: Channel[];
  onSelectChannel: (channelId: string) => void;
  onAddChannel?: (name: string) => void;
  onDeleteChannel?: (channelId: string) => void;
  isAdmin?: boolean;
}

export function ChannelList({ channels, onSelectChannel, onAddChannel, onDeleteChannel, isAdmin = false }: ChannelListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let name = newChannelName.trim();
    if (!name) {
      setError("Channel name is required");
      return;
    }

    // Ensure name starts with #
    if (!name.startsWith('#')) {
      name = `#${name}`;
    }

    if (channels.some(channel => channel.name.toLowerCase() === name.toLowerCase())) {
      setError("Channel name already exists");
      return;
    }

    if (channels.length >= 10) {
      setError("Maximum of 10 channels allowed");
      return;
    }

    onAddChannel?.(name);
    setNewChannelName("");
    setError(null);
    setIsOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation(); // Prevent channel selection when clicking delete
    setChannelToDelete(channel);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (channelToDelete && channelToDelete.name !== '#general') {
      onDeleteChannel?.(channelToDelete.id);
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Channels</h2>
        {isAdmin && (
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
        )}
      </div>

      {channels.map((channel) => (
        <div
          key={channel.id}
          className="flex items-center group"
        >
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onSelectChannel(channel.id)}
          >
            <Hash className="h-4 w-4 mr-2" />
            {channel.name.startsWith('#') ? channel.name.slice(1) : channel.name}
          </Button>
          {isAdmin && channel.name !== '#general' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDeleteClick(e, channel)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {channelToDelete?.name}? This will permanently delete the channel and all its messages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

