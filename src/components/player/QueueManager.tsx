import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { DraggableQueueItem } from './DraggableQueueItem';
import { TrackListMinimal } from './TrackListMinimal';
import { Track } from '../MusicPlayer';
import { Card } from '@/components/ui/card';
import { Music } from 'lucide-react';

interface QueueManagerProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onTrackRemove: (track: Track) => void;
  onReorder: (tracks: Track[]) => void;
  trackListView: 'list' | 'grid' | 'album' | 'minimal';
}

export const QueueManager: React.FC<QueueManagerProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onTrackSelect,
  onTrackRemove,
  onReorder,
  trackListView,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((track) => track.id === active.id);
      const newIndex = tracks.findIndex((track) => track.id === over.id);
      
      const reorderedTracks = arrayMove(tracks, oldIndex, newIndex);
      onReorder(reorderedTracks);
    }
  };

  if (tracks.length === 0) {
    return (
      <Card className="bg-player-surface border-border p-8">
        <div className="text-center">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Queue is empty</h3>
          <p className="text-sm text-muted-foreground">Add some music to get started</p>
        </div>
      </Card>
    );
  }

  // Use minimal view for drag-and-drop if supported, otherwise fall back to regular list
  if (trackListView === 'minimal' || trackListView === 'list') {
    return (
      <Card className="bg-player-surface border-border">
        <div className="p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Queue ({tracks.length})</h3>
          <TrackListMinimal
            tracks={tracks}
            currentTrack={currentTrack}
            onTrackSelect={onTrackSelect}
            onTrackRemove={onTrackRemove}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-player-surface border-border">
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Queue ({tracks.length})</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={tracks} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <DraggableQueueItem
                  key={track.id}
                  track={track}
                  index={index}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onPlay={() => onTrackSelect(track)}
                  onRemove={() => onTrackRemove(track)}
                  compact={false}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </Card>
  );
};