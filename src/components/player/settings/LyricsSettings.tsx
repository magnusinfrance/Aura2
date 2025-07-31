import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Music4 } from 'lucide-react';

interface LyricsSettingsProps {
  onShowLyrics: () => void;
}

export const LyricsSettings: React.FC<LyricsSettingsProps> = ({ 
  onShowLyrics 
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <Music4 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="center">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Music4 className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Lyrics</h4>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              View and search for song lyrics
            </p>
            
            <Button 
              onClick={onShowLyrics}
              className="w-full"
              size="sm"
            >
              Show Lyrics Panel
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Lyrics are fetched automatically when available from online sources.</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};