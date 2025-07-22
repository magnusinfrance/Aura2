import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Playlist, Track } from '../MusicPlayer';
import { 
  ListMusic, 
  Plus, 
  Download, 
  Upload, 
  Trash2,
  Play,
  Music
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlaylistManagerProps {
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  tracks: Track[];
  activePlaylist: Playlist | null;
  setActivePlaylist: React.Dispatch<React.SetStateAction<Playlist | null>>;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  setPlaylists,
  tracks,
  activePlaylist,
  setActivePlaylist,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: Math.random().toString(36),
      name: newPlaylistName,
      tracks: [],
      createdAt: new Date(),
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    setNewPlaylistName('');
    setIsCreateDialogOpen(false);

    toast({
      title: "Playlist created",
      description: `"${newPlaylistName}" has been created successfully.`,
    });
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(null);
    }

    toast({
      title: "Playlist deleted",
      description: "The playlist has been removed from your library.",
    });
  };

  const exportPlaylist = (playlist: Playlist) => {
    const playlistData = {
      name: playlist.name,
      tracks: playlist.tracks.map(track => ({
        name: track.name,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
      })),
      createdAt: playlist.createdAt,
    };

    const blob = new Blob([JSON.stringify(playlistData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Playlist exported",
      description: `"${playlist.name}" has been exported successfully.`,
    });
  };

  const importPlaylist = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const playlistData = JSON.parse(e.target?.result as string);
        
        const importedPlaylist: Playlist = {
          id: Math.random().toString(36),
          name: playlistData.name || 'Imported Playlist',
          tracks: [], // Will need to match with existing tracks
          createdAt: new Date(),
        };

        setPlaylists(prev => [...prev, importedPlaylist]);

        toast({
          title: "Playlist imported",
          description: `"${importedPlaylist.name}" has been imported successfully.`,
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid playlist file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListMusic className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Playlists</h3>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createPlaylist} disabled={!newPlaylistName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Import/Export Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-player-elevated border-border hover:bg-player-surface"
          onClick={() => document.getElementById('playlist-import')?.click()}
        >
          <Upload className="h-3 w-3 mr-2" />
          Import
        </Button>
        <input
          id="playlist-import"
          type="file"
          accept=".json"
          onChange={importPlaylist}
          className="hidden"
        />
      </div>

      {/* Playlist List */}
      <div className="space-y-2">
        {playlists.length === 0 ? (
          <div className="text-center py-6">
            <Music className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No playlists created yet
            </p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={`
                p-3 rounded-lg border transition-all duration-200 cursor-pointer
                ${activePlaylist?.id === playlist.id
                  ? 'bg-primary/10 border-primary/20'
                  : 'bg-player-elevated border-border hover:bg-player-surface'
                }
              `}
              onClick={() => setActivePlaylist(playlist)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{playlist.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  {playlist.tracks.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportPlaylist(playlist);
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(playlist.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active Playlist Info */}
      {activePlaylist && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium">Active Playlist</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {activePlaylist.name} • {activePlaylist.tracks.length} tracks
          </p>
        </div>
      )}
    </div>
  );
};