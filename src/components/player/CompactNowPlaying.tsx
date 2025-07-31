import React from 'react';
import { AlbumArt } from './AlbumArt';
import { Track } from '../MusicPlayer';
import { EnhancedVisualizer } from './EnhancedVisualizer';

interface CompactNowPlayingProps {
  track: Track | null;
  isPlaying: boolean;
  analyser?: AnalyserNode | null;
}

export const CompactNowPlaying: React.FC<CompactNowPlayingProps> = ({
  track,
  isPlaying,
  analyser
}) => {
  return (
    <div className="bg-player-surface border border-border rounded-lg overflow-hidden relative h-full flex flex-col">
      {/* Background Visualizer - Full Height */}
      <div className="absolute inset-0">
        <EnhancedVisualizer 
          analyser={analyser}
          isPlaying={isPlaying}
        />
      </div>
      
      {/* Content Overlay */}
      <div className="relative z-10 flex-1 flex items-center p-3 bg-gradient-to-b from-black/60 via-black/40 to-transparent">
        <div className="flex items-center space-x-3 w-full">
          <AlbumArt track={track} isPlaying={isPlaying} size="sm" />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate drop-shadow-lg text-white">
              {track?.name || 'No track selected'}
            </h3>
            <p className="text-xs text-white/90 truncate drop-shadow-lg">
              {track?.artist || 'Select a track to play'}
            </p>
            {track?.album && (
              <p className="text-xs text-white/75 truncate drop-shadow-lg">
                {track.album}
              </p>
            )}
            {track?.duration && (
              <p className="text-xs text-white/60 truncate drop-shadow-lg">
                {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>

          {/* Status indicator */}
          <div className={`
            w-2 h-2 rounded-full shadow-glow
            ${isPlaying ? 'bg-white animate-pulse' : 'bg-white/50'}
          `} />
        </div>
      </div>
    </div>
  );
};