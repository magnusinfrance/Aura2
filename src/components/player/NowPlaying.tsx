import React from 'react';
import { Track } from '../MusicPlayer';
import { Music, Disc3 } from 'lucide-react';

interface NowPlayingProps {
  track: Track | null;
  isPlaying: boolean;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({ track, isPlaying }) => {
  if (!track) {
    return (
      <div className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <Music className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-muted-foreground">
          No track selected
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Choose a song to start playing
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-6">
        {/* Album Art / Icon */}
        <div className="relative">
          <div className={`
            w-24 h-24 bg-gradient-primary rounded-lg flex items-center justify-center
            ${isPlaying ? 'animate-pulse-glow' : ''}
          `}>
            <Disc3 className={`h-12 w-12 text-primary-foreground ${
              isPlaying ? 'animate-spin-slow' : ''
            }`} />
          </div>
          
          {isPlaying && (
            <div className="absolute -inset-1 bg-gradient-accent rounded-lg blur opacity-30 animate-pulse-glow" />
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-foreground truncate">
            {track.name}
          </h2>
          <p className="text-lg text-muted-foreground truncate mt-1">
            {track.artist || 'Unknown Artist'}
          </p>
          <p className="text-sm text-muted-foreground/70 truncate mt-1">
            {track.album || 'Unknown Album'}
          </p>
          
          {/* Status Indicator */}
          <div className="flex items-center mt-3">
            <div className={`
              w-2 h-2 rounded-full mr-2
              ${isPlaying ? 'bg-player-success animate-pulse' : 'bg-muted-foreground'}
            `} />
            <span className="text-xs font-medium text-muted-foreground">
              {isPlaying ? 'Now Playing' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Visual Elements */}
        <div className="hidden md:flex items-center space-x-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`
                w-1 bg-gradient-accent rounded-full
                ${isPlaying ? 'animate-pulse' : 'opacity-30'}
              `}
              style={{
                height: isPlaying ? `${20 + Math.random() * 20}px` : '10px',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};