import React, { useState } from 'react';
import { Track } from '../MusicPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlbumArt } from './AlbumArt';
import { 
  Play, 
  Pause, 
  Music, 
  Search,
  Clock,
  Disc3,
  List,
  Grid3X3
} from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  onTrackSelect: (track: Track) => void;
  viewMode: 'list' | 'grid' | 'album';
}

type TrackDisplayMode = 'compact' | 'detailed';

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  onTrackSelect,
  viewMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackDisplayMode, setTrackDisplayMode] = useState<TrackDisplayMode>('detailed');

  const filteredTracks = tracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (duration?: number) => {
    if (!duration) return '--:--';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div className="p-8 text-center">
        <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No tracks loaded
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Add some audio files to get started
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tracks, artists, albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-player-elevated border-border"
        />
      </div>

      {/* Track Count and Display Toggle */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setTrackDisplayMode(trackDisplayMode === 'compact' ? 'detailed' : 'compact')}
        >
          {trackDisplayMode === 'compact' ? <List className="h-3 w-3" /> : <Grid3X3 className="h-3 w-3" />}
        </Button>
      </div>

      {/* Track List */}
      {viewMode === 'list' && (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-3">Artist</div>
            <div className="col-span-2">Album</div>
            <div className="col-span-1 text-right">
              <Clock className="h-3 w-3 ml-auto" />
            </div>
          </div>

          {/* Tracks */}
          {filteredTracks.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            
            return (
              <div
                key={track.id}
                className={`
                  grid grid-cols-12 gap-3 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200
                  hover:bg-player-elevated group
                  ${isCurrentTrack ? 'bg-player-elevated border border-primary/20' : ''}
                `}
                onClick={() => onTrackSelect(track)}
                onDoubleClick={() => onTrackSelect(track)}
              >
                <div className="col-span-1 flex items-center">
                  {isCurrentTrack ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="flex space-x-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-primary rounded-full animate-pulse"
                            style={{
                              height: `${8 + Math.random() * 8}px`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground group-hover:hidden">
                      {index + 1}
                    </span>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden group-hover:flex h-8 w-8 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="col-span-5 flex items-center space-x-3">
                  {trackDisplayMode === 'detailed' && (
                    <div className="w-4 h-4 flex-shrink-0">
                      <AlbumArt track={track} isPlaying={isCurrentTrack} size="sm" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`font-medium text-sm truncate ${
                      isCurrentTrack ? 'text-primary' : 'text-foreground'
                    }`}>
                      {track.name}
                    </p>
                  </div>
                </div>
                
                <div className="col-span-3 flex items-center">
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist || 'Unknown Artist'}
                  </p>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <p className="text-xs text-muted-foreground truncate">
                    {track.album || 'Unknown Album'}
                  </p>
                </div>
                
                <div className="col-span-1 flex items-center justify-end">
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatDuration(track.duration)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTracks.map((track) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            
            return (
              <div
                key={track.id}
                className={`
                  p-4 rounded-lg cursor-pointer transition-all duration-200 group
                  hover:bg-player-elevated hover:shadow-card-player
                  ${isCurrentTrack ? 'bg-player-elevated border border-primary/20' : 'bg-player-surface'}
                `}
                onClick={() => onTrackSelect(track)}
              >
                <div className="relative mb-3">
                  <div className="w-full aspect-square">
                    <AlbumArt track={track} isPlaying={isCurrentTrack} size="md" />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/20 backdrop-blur-sm"
                  >
                    <Play className="h-6 w-6 text-white" />
                  </Button>
                </div>
                
                <h4 className={`font-medium truncate ${
                  isCurrentTrack ? 'text-primary' : 'text-foreground'
                }`}>
                  {track.name}
                </h4>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {track.artist || 'Unknown Artist'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Album View */}
      {viewMode === 'album' && (
        <div className="space-y-6">
          {/* Group tracks by album */}
          {Object.entries(
            filteredTracks.reduce((acc, track) => {
              const album = track.album || 'Unknown Album';
              if (!acc[album]) acc[album] = [];
              acc[album].push(track);
              return acc;
            }, {} as Record<string, Track[]>)
          ).map(([album, albumTracks]) => (
            <div key={album} className="bg-player-elevated rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16">
                  <AlbumArt track={albumTracks[0]} isPlaying={false} size="md" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{album}</h3>
                  <p className="text-sm text-muted-foreground">
                    {albumTracks.length} track{albumTracks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                {albumTracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  
                  return (
                    <div
                      key={track.id}
                      className={`
                        flex items-center space-x-3 p-2 rounded cursor-pointer transition-all duration-200
                        hover:bg-player-surface group
                        ${isCurrentTrack ? 'bg-player-surface border-l-2 border-primary' : ''}
                      `}
                      onClick={() => onTrackSelect(track)}
                    >
                      <span className="text-sm text-muted-foreground w-6">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          isCurrentTrack ? 'text-primary' : 'text-foreground'
                        }`}>
                          {track.name}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {formatDuration(track.duration)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};