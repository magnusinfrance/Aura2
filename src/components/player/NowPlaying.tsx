import React from 'react';
import { Track } from '../MusicPlayer';
import { Music } from 'lucide-react';
import { EnhancedVisualizer } from './EnhancedVisualizer';
import { AlbumArt } from './AlbumArt';
import { SoundCloudPlayer } from './SoundCloudPlayer';


interface NowPlayingProps {
  track: Track | null;
  isPlaying: boolean;
  analyser?: AnalyserNode | null;
  onSoundCloudPlay?: () => void;
  onSoundCloudPause?: () => void;
  onSoundCloudEnded?: () => void;
  onSoundCloudTimeUpdate?: (currentTime: number, duration: number) => void;
  volume?: number;
}

export const NowPlaying: React.FC<NowPlayingProps> = ({ 
  track, 
  isPlaying, 
  analyser,
  onSoundCloudPlay = () => {},
  onSoundCloudPause = () => {},
  onSoundCloudEnded = () => {},
  onSoundCloudTimeUpdate = () => {},
  volume = 0.7
}) => {
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
  
  // Handle SoundCloud tracks
  if (track.soundcloud) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{track.name}</h2>
          <p className="text-lg text-muted-foreground mb-4">{track.artist}</p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <SoundCloudPlayer
            track={track}
            isPlaying={isPlaying}
            volume={volume}
            onPlay={onSoundCloudPlay}
            onPause={onSoundCloudPause}
            onEnded={onSoundCloudEnded}
            onTimeUpdate={onSoundCloudTimeUpdate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-12 overflow-hidden min-h-[400px] flex items-center">
      {/* Background Visualizer */}
      <div className="absolute inset-0">
        <EnhancedVisualizer 
          analyser={analyser}
          isPlaying={isPlaying}
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 flex items-center space-x-8 w-full">
        {/* Album Art */}
        <div className="relative">
          <AlbumArt track={track} isPlaying={isPlaying} size="lg" />
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h2 className={`font-bold text-foreground truncate drop-shadow-sm mb-2 ${
            track.name.length > 30 ? 'text-2xl' : track.name.length > 20 ? 'text-3xl' : 'text-4xl'
          }`}>
            {track.name}
          </h2>
          <p className="text-2xl text-muted-foreground truncate mt-2 drop-shadow-sm">
            {track.artist || 'Unknown Artist'}
          </p>
          <p className="text-lg text-muted-foreground/70 truncate mt-2 drop-shadow-sm">
            {track.album || 'Unknown Album'}
          </p>
          
          {/* Status Indicator */}
          <div className="flex items-center mt-4">
            <div className={`
              w-3 h-3 rounded-full mr-3
              ${isPlaying ? 'bg-player-success animate-pulse' : 'bg-muted-foreground'}
            `} />
            <span className="text-sm font-medium text-muted-foreground drop-shadow-sm">
              {isPlaying ? 'Now Playing' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};