import React, { useState } from 'react';
import { Track } from '../MusicPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  Search, 
  Plus, 
  Shuffle, 
  Music, 
  X,
  SkipForward,
  Trash2,
  Save,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
// Removed restrictToVerticalAxis import for now
import { DraggableQueueItem } from './DraggableQueueItem';
import { SaveQueueDialog } from './SaveQueueDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RightSidePlaylistProps {
  currentPlaylist: Track[];
  setCurrentPlaylist: (tracks: Track[]) => void;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onNext: () => void;
  isShuffled: boolean;
  onShuffleToggle: () => void;
  onSavePlaylist?: (name: string, tracks: Track[]) => void;
}

export const RightSidePlaylist: React.FC<RightSidePlaylistProps> = ({
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
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const filteredPlaylist = currentPlaylist.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addTrackToPlaylist = (track: Track) => {
    setCurrentPlaylist([...currentPlaylist, track]);
    toast({
      title: "Track added",
      description: `"${track.name}" added to queue`,
    });
  };

  const removeTrackFromPlaylist = (index: number) => {
    const newPlaylist = currentPlaylist.filter((_, i) => i !== index);
    setCurrentPlaylist(newPlaylist);
    toast({
      title: "Track removed",
      description: "Track removed from queue",
    });
  };

  const clearPlaylist = () => {
    setCurrentPlaylist([]);
    toast({
      title: "Queue cleared",
      description: "All tracks removed from queue",
    });
  };

  const playAllFromHere = (startIndex: number) => {
    const track = currentPlaylist[startIndex];
    if (track) {
      onTrackSelect(track);
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = currentPlaylist.findIndex(track => track.id === active.id);
      const newIndex = currentPlaylist.findIndex(track => track.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newPlaylist = arrayMove(currentPlaylist, oldIndex, newIndex);
        setCurrentPlaylist(newPlaylist);
        
        toast({
          title: "Queue reordered",
          description: "Track moved to new position",
        });
      }
    }
  };

  const handleFileDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const audioFiles = files.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma', '.mod', '.s3m', '.xm', '.it'].includes(extension);
    });

    if (audioFiles.length > 0) {
      const newTracks: Track[] = audioFiles.map(file => ({
        id: Math.random().toString(36),
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(file),
        file,
      }));

      setCurrentPlaylist([...currentPlaylist, ...newTracks]);
      
      toast({
        title: "Files added to queue",
        description: `Added ${audioFiles.length} track${audioFiles.length !== 1 ? 's' : ''} to the queue`,
      });
    } else {
      toast({
        title: "No audio files found",
        description: "Please drop supported audio files",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleSaveQueue = (name: string) => {
    if (onSavePlaylist && currentPlaylist.length > 0) {
      onSavePlaylist(name, currentPlaylist);
      toast({
        title: "Playlist saved",
        description: `"${name}" has been saved with ${currentPlaylist.length} tracks`,
      });
    }
  };

  return (
    <TooltipProvider>
      <div 
        className={`h-full flex flex-col bg-player-surface border-2 border-dashed transition-all duration-200 ${
          dragOver ? 'border-primary bg-primary/5' : 'border-transparent'
        }`}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Header */}
        <div className="p-3 border-b border-border relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Music className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Playing Queue</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isShuffled ? "default" : "outline"}
                    size="sm"
                    onClick={onShuffleToggle}
                  >
                    <Shuffle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle shuffle mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    disabled={currentPlaylist.length === 0}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save queue as playlist</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddTracks(!showAddTracks)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add tracks to queue</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-player-elevated border-border"
            />
          </div>

          {dragOver && (
            <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-primary">Drop audio files here</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Add tracks panel */}
          {showAddTracks && (
            <div className="bg-player-elevated border-b border-border">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Add tracks to queue</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddTracks(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <ScrollArea className="h-32">
                  <div className="space-y-0.5">
                    {allTracks.map(track => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-player-surface transition-colors group cursor-pointer"
                        onClick={() => addTrackToPlaylist(track)}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center flex-shrink-0">
                            <Music className="h-3 w-3 text-primary-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{track.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {track.artist || 'Unknown Artist'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Playlist */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {currentPlaylist.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">Queue is empty</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Add tracks or drag files here
                  </p>
                </div>
              ) : filteredPlaylist.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">No matching tracks</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={filteredPlaylist.map(track => track.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-0.5">
                      {filteredPlaylist.map((track, index) => {
                        const isCurrentTrack = currentTrack?.id === track.id;
                        const actualIndex = currentPlaylist.findIndex(t => t.id === track.id);
                        
                        return (
                          <DraggableQueueItem
                            key={track.id}
                            track={track}
                            index={actualIndex}
                            isCurrentTrack={isCurrentTrack}
                            isPlaying={isPlaying}
                            onPlay={() => onTrackSelect(track)}
                            onRemove={() => removeTrackFromPlaylist(actualIndex)}
                            onDoubleClick={() => onTrackSelect(track)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        {currentPlaylist.length > 0 && (
          <div className="border-t border-border p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {currentPlaylist.length} track{currentPlaylist.length !== 1 ? 's' : ''} in queue
              </div>
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearPlaylist()}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear queue</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onNext}
                    >
                      <SkipForward className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Skip to next track</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        <SaveQueueDialog
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={handleSaveQueue}
          tracks={currentPlaylist}
        />
      </div>
    </TooltipProvider>
  );
};