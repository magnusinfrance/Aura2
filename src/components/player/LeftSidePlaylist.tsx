import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableTrackItem } from './DraggableTrackItem';
import { SaveQueueDialog } from './SaveQueueDialog';
import { Track } from '../MusicPlayer';
import auraLogo from '@/assets/aura-logo-transparent.png';
import { 
  Search, 
  Plus, 
  Save, 
  Shuffle, 
  Trash2, 
  SkipForward,
  Music,
  FolderOpen
} from 'lucide-react';

interface LeftSidePlaylistProps {
  currentPlaylist: Track[];
  setCurrentPlaylist: (tracks: Track[]) => void;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onNext: () => void;
  isShuffled: boolean;
  onShuffleToggle: () => void;
  onSavePlaylist: (name: string, tracks: Track[]) => void;
}

export const LeftSidePlaylist: React.FC<LeftSidePlaylistProps> = ({
  currentPlaylist,
  setCurrentPlaylist,
  allTracks,
  currentTrack,
  isPlaying,
  onTrackSelect,
  onNext,
  isShuffled,
  onShuffleToggle,
  onSavePlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredPlaylist = currentPlaylist.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addTrackToPlaylist = (track: Track) => {
    if (!currentPlaylist.find(t => t.id === track.id)) {
      setCurrentPlaylist([...currentPlaylist, track]);
    }
  };

  const removeTrackFromPlaylist = (trackId: string) => {
    setCurrentPlaylist(currentPlaylist.filter(t => t.id !== trackId));
  };

  const clearPlaylist = () => {
    setCurrentPlaylist([]);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = currentPlaylist.findIndex(track => track.id === active.id);
      const newIndex = currentPlaylist.findIndex(track => track.id === over.id);
      
      setCurrentPlaylist(arrayMove(currentPlaylist, oldIndex, newIndex));
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const audioFiles = files.filter(file => 
      file.type.startsWith('audio/') || 
      /\.(mp3|flac|wav|ogg|m4a|aac|wma)$/i.test(file.name)
    );
    
    // This would need to be handled by the parent component
    // For now, we'll just prevent the default behavior
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleSaveQueue = (name: string) => {
    onSavePlaylist(name, currentPlaylist);
    setShowSaveDialog(false);
  };

  return (
    <div className="h-full flex flex-col bg-player-surface">
      {/* Compact Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <img src={auraLogo} alt="Aura" className="h-4 w-4" />
            Queue ({currentPlaylist.length})
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShuffleToggle}
              className={`h-7 w-7 p-0 ${isShuffled ? 'text-player-accent' : 'text-muted-foreground'}`}
            >
              <Shuffle className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={currentPlaylist.length === 0}
              className="h-7 w-7 p-0"
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddTracks(!showAddTracks)}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs bg-player-elevated border-border"
          />
        </div>
      </div>

      {/* Add Tracks Panel */}
      {showAddTracks && (
        <div className="border-b border-border bg-player-elevated">
          <div className="p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <FolderOpen className="h-3 w-3" />
              Add from Library ({allTracks.length})
            </h4>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {allTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-1 rounded hover:bg-player-surface cursor-pointer group"
                    onClick={() => addTrackToPlaylist(track)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.artist || 'Unknown Artist'}
                      </p>
                    </div>
                    <Plus className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Playlist */}
      <div 
        className={`flex-1 ${isDragOver ? 'bg-player-elevated border-2 border-dashed border-player-accent' : ''}`}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <ScrollArea className="h-full">
          {currentPlaylist.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tracks in queue</p>
              <p className="text-xs mt-1">Drop files here or click + to add</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={filteredPlaylist.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-2 space-y-1">
                  {filteredPlaylist.map((track, index) => (
                    <DraggableTrackItem
                      key={track.id}
                      track={track}
                      index={index}
                      isCurrentTrack={currentTrack?.id === track.id}
                      isPlaying={isPlaying && currentTrack?.id === track.id}
                      onPlay={() => onTrackSelect(track)}
                      onRemove={() => removeTrackFromPlaylist(track.id)}
                      onDoubleClick={() => onTrackSelect(track)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </ScrollArea>
      </div>

      {/* Footer */}
      {currentPlaylist.length > 0 && (
        <div className="p-2 border-t border-border">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPlaylist}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              className="h-7 text-xs"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Next
            </Button>
          </div>
        </div>
      )}

      <SaveQueueDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveQueue}
        tracks={currentPlaylist}
      />
    </div>
  );
};