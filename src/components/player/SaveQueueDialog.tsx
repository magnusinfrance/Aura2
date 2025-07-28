import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Track } from '../MusicPlayer';
import { Save } from 'lucide-react';

interface SaveQueueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  tracks: Track[];
}

export const SaveQueueDialog: React.FC<SaveQueueDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  tracks,
}) => {
  const [playlistName, setPlaylistName] = useState('');

  const handleSave = () => {
    if (playlistName.trim()) {
      onSave(playlistName.trim());
      setPlaylistName('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Save className="h-5 w-5" />
            <span>Save Queue as Playlist</span>
          </DialogTitle>
          <DialogDescription>
            Save the current queue ({tracks.length} track{tracks.length !== 1 ? 's' : ''}) as a new playlist.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              placeholder="Enter playlist name..."
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-player-elevated border-border"
              autoFocus
            />
          </div>
          
          {tracks.length > 0 && (
            <div className="bg-player-elevated rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Tracks to be saved:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tracks.slice(0, 5).map((track, index) => (
                  <div key={track.id} className="text-xs text-muted-foreground flex justify-between">
                    <span className="truncate">{index + 1}. {track.name}</span>
                    <span>{track.artist || 'Unknown'}</span>
                  </div>
                ))}
                {tracks.length > 5 && (
                  <p className="text-xs text-muted-foreground italic">
                    ...and {tracks.length - 5} more tracks
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!playlistName.trim() || tracks.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Playlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};