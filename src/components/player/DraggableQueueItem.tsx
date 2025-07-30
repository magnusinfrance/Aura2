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
  onDoubleClick?: () => void;
  compact?: boolean;
}

export const DraggableQueueItem: React.FC<DraggableQueueItemProps> = ({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onRemove,
  onDoubleClick,
  compact = false,
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
        group flex items-center ${compact ? 'space-x-1 py-1 px-1' : 'space-x-2 py-1 px-2'} rounded-md transition-all duration-200
        ${isDragging ? 'opacity-50 bg-player-elevated scale-105 shadow-lg' : ''}
        ${isCurrentTrack ? 'bg-primary/10 border border-primary/30' : 'hover:bg-player-elevated'}
        cursor-pointer
      `}
      onDoubleClick={onDoubleClick || (() => onPlay())}
    >
      {/* Drag Handle */}
      {!compact && (
        <div
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Track Number / Playing Indicator */}
      <div className={`${compact ? "w-4" : "w-6"} flex items-center justify-center`}>
        {isCurrentTrack && isPlaying ? (
          <div className="flex space-x-0.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${compact ? 4 : 6 + Math.random() * 6}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <span className={`${compact ? 'text-xs' : 'text-xs'} text-muted-foreground`}>{index + 1}</span>
        )}
      </div>

      {/* Track Info - No album art, only text */}
      <div className="flex-1 min-w-0">
        {compact ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium truncate ${
                isCurrentTrack ? 'text-primary' : 'text-foreground'
              }`}>
                {track.name}
              </p>
              <p className="text-xs text-muted-foreground/80 truncate">
                {track.artist || 'Unknown Artist'}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground font-mono">
                {formatDuration(track.duration)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};