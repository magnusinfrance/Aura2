import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Track } from '../MusicPlayer';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, GripVertical } from 'lucide-react';
import { AlbumArt } from './AlbumArt';

interface DraggableTrackItemProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDoubleClick?: () => void;
}

export const DraggableTrackItem: React.FC<DraggableTrackItemProps> = ({
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

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group
        hover:bg-player-elevated
        ${isCurrentTrack ? 'bg-primary/10 border-l-4 border-primary ring-1 ring-primary/20' : ''}
        ${isDragging ? 'opacity-50 scale-105 shadow-lg z-50' : ''}
      `}
      onDoubleClick={onDoubleClick}
    >
      {/* Drag Handle */}
      <div
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Track Number / Play indicator */}
      <div className="w-6 text-center text-sm text-muted-foreground">
        {isCurrentTrack ? (
          <div className="flex space-x-0.5 justify-center">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        ) : (
          index + 1
        )}
      </div>

      {/* Album Art */}
      <AlbumArt track={track} isPlaying={isCurrentTrack && isPlaying} size="sm" />

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${
          isCurrentTrack ? 'text-primary' : 'text-foreground'
        }`}>
          {track.name}
        </h4>
        <p className="text-sm text-muted-foreground truncate">
          {track.artist || 'Unknown Artist'}
        </p>
        {track.album && (
          <p className="text-xs text-muted-foreground/70 truncate">
            {track.album}
          </p>
        )}
      </div>

      {/* Duration */}
      {track.duration && (
        <div className="text-sm text-muted-foreground tabular-nums">
          {formatDuration(track.duration)}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-primary/20"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
        >
          {isCurrentTrack && isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};