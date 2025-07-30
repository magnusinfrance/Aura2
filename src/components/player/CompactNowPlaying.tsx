import React from 'react';
import { AlbumArt } from './AlbumArt';
import { Track } from '../MusicPlayer';

interface CompactNowPlayingProps {
  track: Track | null;
  isPlaying: boolean;
}

export const CompactNowPlaying: React.FC<CompactNowPlayingProps> = ({
  track,
  isPlaying,
}) => {
  return (
    <div className="bg-player-surface border border-border rounded-lg p-3">
      <div className="flex items-center space-x-3">
        <AlbumArt track={track} isPlaying={isPlaying} size="sm" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {track?.name || 'No track selected'}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {track?.artist || 'Select a track to play'}
          </p>
          {track?.album && (
            <p className="text-xs text-muted-foreground/70 truncate">
              {track.album}
            </p>
          )}
          {track?.duration && (
            <p className="text-xs text-muted-foreground/50 truncate">
              {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Status indicator */}
        <div className={`
          w-2 h-2 rounded-full
          ${isPlaying ? 'bg-player-success animate-pulse' : 'bg-muted-foreground'}
        `} />
      </div>
    </div>
  );
};