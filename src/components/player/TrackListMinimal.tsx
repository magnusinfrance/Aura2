import React from 'react';
import { Track } from '../MusicPlayer';
import { Button } from '@/components/ui/button';
import { Play, Music, X } from 'lucide-react';

interface TrackListMinimalProps {
  tracks: Track[];
  currentTrack: Track | null;
  onTrackSelect: (track: Track) => void;
  onTrackRemove?: (track: Track) => void;
}

export const TrackListMinimal: React.FC<TrackListMinimalProps> = ({
  tracks,
  currentTrack,
  onTrackSelect,
  onTrackRemove,
}) => {
  if (tracks.length === 0) {
    return (
      <div className="p-4 text-center">
        <Music className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Queue is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        
        return (
          <div
            key={track.id}
            className={`
              flex items-center space-x-2 px-2 py-1.5 rounded cursor-pointer transition-all duration-200
              hover:bg-player-elevated group text-xs
              ${isCurrentTrack ? 'bg-player-elevated border-l-2 border-primary' : ''}
            `}
            onClick={() => onTrackSelect(track)}
          >
            <span className="text-muted-foreground w-4 text-center flex-shrink-0">
              {isCurrentTrack ? (
                <div className="flex space-x-0.5 justify-center">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${4 + Math.random() * 4}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                index + 1
              )}
            </span>
            
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate text-xs ${
                isCurrentTrack ? 'text-primary' : 'text-foreground'
              }`}>
                {track.name}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {track.artist || 'Unknown Artist'}
              </p>
            </div>

            {onTrackRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackRemove(track);
                }}
              >
                <X className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};