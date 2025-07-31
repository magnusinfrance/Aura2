import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FolderOpen, Trash2 } from 'lucide-react';

interface LibrarySettingsProps {
  onFilesAdd?: (files: any[]) => void;
  onClearLibrary?: () => void;
}

export const LibrarySettings: React.FC<LibrarySettingsProps> = ({ 
  onFilesAdd,
  onClearLibrary
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <FolderOpen className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-player-surface border-border">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Music Library</h3>
            {onClearLibrary && (
              <Button
                onClick={onClearLibrary}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Library
              </Button>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Supported Formats</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• MP3, FLAC, WAV, OGG</div>
              <div>• M4A, AAC, WMA</div>
              <div>• 16-bit & 24-bit support</div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};