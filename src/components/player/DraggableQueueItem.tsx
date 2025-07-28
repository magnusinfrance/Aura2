import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Track } from '../MusicPlayer';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, GripVertical, Music } from 'lucide-react';

interface DraggableQueueItemProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDoubleClick: () => void;
}

export const DraggableQueueItem: React.FC<DraggableQueueItemProps> = ({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onRemove,
  onDoubleClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center space-x-2 py-1 px-2 rounded-md transition-all duration-200
        ${isDragging ? 'opacity-50 bg-player-elevated scale-105 shadow-lg' : ''}
        ${isCurrentTrack ? 'bg-primary/10 border border-primary/30' : 'hover:bg-player-elevated'}
        cursor-pointer
      `}
      onDoubleClick={onDoubleClick}
    >
      {/* Drag Handle */}
      <div
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Track Number / Playing Indicator */}
      <div className="w-6 flex items-center justify-center">
        {isCurrentTrack && isPlaying ? (
          <div className="flex space-x-0.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${6 + Math.random() * 6}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{index + 1}</span>
        )}
      </div>

      {/* Album Art */}
      <div className="w-8 h-8 bg-gradient-primary rounded flex items-center justify-center flex-shrink-0">
        <Music className="h-4 w-4 text-primary-foreground" />
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium truncate ${
              isCurrentTrack ? 'text-primary' : 'text-foreground'
            }`}>
              {track.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {track.artist || 'Unknown Artist'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Duration */}
            <span className="text-xs text-muted-foreground font-mono">
              {formatDuration(track.duration)}
            </span>

            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};