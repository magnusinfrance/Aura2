import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1
} from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffled,
  repeatMode,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onShuffleToggle,
  onRepeatToggle,
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one': return Repeat1;
      case 'all': return Repeat;
      default: return Repeat;
    }
  };

  const RepeatIcon = getRepeatIcon();

  return (
    <div className="p-4 space-y-3">
      {/* Progress Bar */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-muted-foreground font-mono">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={([value]) => onSeek(value)}
            className="cursor-pointer"
          />
        </div>
        <span className="text-sm text-muted-foreground font-mono">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShuffleToggle}
            className={`hover:bg-player-elevated ${
              isShuffled ? 'text-player-accent' : 'text-muted-foreground'
            }`}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRepeatToggle}
            className={`hover:bg-player-elevated ${
              repeatMode !== 'none' ? 'text-player-accent' : 'text-muted-foreground'
            }`}
          >
            <RepeatIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Center Controls */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            className="hover:bg-player-elevated text-foreground"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={onPlayPause}
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground rounded-full h-12 w-12 shadow-glow"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className="hover:bg-player-elevated text-foreground"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Right Controls - Volume */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
            className="hover:bg-player-elevated text-muted-foreground"
          >
            {volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <div className="w-24">
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={([value]) => onVolumeChange(value / 100)}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};