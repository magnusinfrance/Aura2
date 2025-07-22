import React, { useState } from 'react';
import { Track, Playlist } from '../MusicPlayer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Play,
  Pause,
  Plus,
  X,
  Search,
  Music,
  Shuffle,
  SkipForward,
  Volume2,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlbumArt } from './AlbumArt';

interface RightSidePlaylistProps {
  currentPlaylist: Track[];
  setCurrentPlaylist: React.Dispatch<React.SetStateAction<Track[]>>;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track) => void;
  onNext: () => void;
  isShuffled: boolean;
  onShuffleToggle: () => void;
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTracks, setShowAddTracks] = useState(false);
  const { toast } = useToast();

  const filteredPlaylist = currentPlaylist.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableTracksToAdd = allTracks.filter(track => 
    !currentPlaylist.some(playlistTrack => playlistTrack.id === track.id)
  );

  const addTrackToPlaylist = (track: Track) => {
    setCurrentPlaylist(prev => [...prev, track]);
    toast({
      title: "Track added",
      description: `"${track.name}" added to current playlist`,
    });
  };

  const removeTrackFromPlaylist = (trackId: string) => {
    setCurrentPlaylist(prev => prev.filter(track => track.id !== trackId));
    toast({
      title: "Track removed",
      description: "Track removed from current playlist",
    });
  };

  const clearPlaylist = () => {
    setCurrentPlaylist([]);
    toast({
      title: "Playlist cleared",
      description: "All tracks removed from current playlist",
    });
  };

  const playAllFromHere = (startIndex: number) => {
    const track = filteredPlaylist[startIndex];
    if (track) {
      onTrackSelect(track);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-player-surface">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <List className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Now Playing Queue</h3>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShuffleToggle}
              className={isShuffled ? 'text-primary' : ''}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddTracks(!showAddTracks)}
              className="hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-player-elevated border-border"
          />
        </div>

        {/* Queue Info */}
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <span>{currentPlaylist.length} tracks</span>
          {currentPlaylist.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearPlaylist}
              className="text-destructive hover:text-destructive h-6"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Add Tracks Panel */}
      {showAddTracks && (
        <div className="p-4 border-b border-border bg-player-elevated">
          <h4 className="font-medium mb-2 text-sm">Add tracks to queue</h4>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {availableTracksToAdd.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-player-surface group"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <AlbumArt track={track} isPlaying={false} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.artist || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addTrackToPlaylist(track)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {availableTracksToAdd.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All tracks are already in queue
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Playlist */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredPlaylist.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-medium text-muted-foreground mb-1">
                {searchQuery ? 'No matching tracks' : 'Queue is empty'}
              </h4>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery ? 'Try a different search term' : 'Add some tracks to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPlaylist.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`
                      p-3 rounded-lg border transition-all duration-200 group cursor-pointer
                      ${isCurrentTrack
                        ? 'bg-primary/10 border-primary/20'
                        : 'bg-player-elevated border-border hover:bg-player-surface'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <AlbumArt 
                          track={track} 
                          isPlaying={isCurrentTrack && isPlaying} 
                          size="sm" 
                        />
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 text-white h-full w-full rounded-lg transition-opacity"
                          onClick={() => playAllFromHere(index)}
                        >
                          {isCurrentTrack && isPlaying ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist || 'Unknown Artist'}
                        </p>
                        {track.duration && (
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(track.duration)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        {isCurrentTrack && (
                          <div className="flex items-center">
                            <Volume2 className="h-3 w-3 text-primary mr-1" />
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          </div>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackFromPlaylist(track.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Queue Controls */}
      {currentPlaylist.length > 0 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredPlaylist.findIndex(t => t.id === currentTrack?.id) + 1} of {filteredPlaylist.length}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              className="hover:bg-primary/10"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};