import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Cloud, Music, Unlink, RefreshCw } from 'lucide-react';

interface SoundCloudTrack {
  id: string;
  name: string;
  artist: string;
  duration?: number;
  url: string;
  artwork?: string;
  genre?: string;
  description?: string;
  soundcloud_id: number;
}

interface SoundCloudIntegrationProps {
  onTracksAdd: (tracks: any[]) => void;
}

export const SoundCloudIntegration: React.FC<SoundCloudIntegrationProps> = ({ onTracksAdd }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tracks, setTracks] = useState<SoundCloudTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const { toast } = useToast();

  // Check if user is connected to SoundCloud
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_connections')
        .select('id')
        .eq('service_type', 'soundcloud')
        .single();

      if (!error && data) {
        setIsConnected(true);
        fetchTracks();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectToSoundCloud = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to connect to SoundCloud.",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('soundcloud-auth', {
        body: { action: 'connect' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open SoundCloud authorization in a new window
      const authWindow = window.open(data.authUrl, 'soundcloud-auth', 
        'width=600,height=600,scrollbars=yes,resizable=yes');

      // Listen for the callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'soundcloud-callback') {
          authWindow?.close();
          handleCallback(event.data.code);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

    } catch (error: any) {
      console.error('SoundCloud connection error:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Failed to connect to SoundCloud.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallback = async (code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('soundcloud-auth', {
        body: { action: 'callback', code },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setIsConnected(true);
      toast({
        title: "Connected!",
        description: "Successfully connected to SoundCloud.",
      });
      
      fetchTracks();
    } catch (error: any) {
      console.error('Callback error:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Failed to complete SoundCloud connection.",
      });
    }
  };

  const fetchTracks = async () => {
    setIsLoadingTracks(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('soundcloud-auth', {
        body: { action: 'fetch-tracks' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setTracks(data.tracks || []);
      toast({
        title: "Tracks loaded",
        description: `Found ${data.tracks?.length || 0} tracks from SoundCloud.`,
      });
    } catch (error: any) {
      console.error('Fetch tracks error:', error);
      toast({
        variant: "destructive",
        title: "Failed to load tracks",
        description: error.message || "Could not load tracks from SoundCloud.",
      });
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('soundcloud-auth', {
        body: { action: 'disconnect' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setIsConnected(false);
      setTracks([]);
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from SoundCloud.",
      });
    } catch (error: any) {
      console.error('Disconnect error:', error);
      toast({
        variant: "destructive",
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect from SoundCloud.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTrackToPlayer = (track: SoundCloudTrack) => {
    // Convert SoundCloud track to player format
    const playerTrack = {
      id: track.id,
      name: track.name,
      artist: track.artist,
      duration: track.duration,
      url: track.url,
      file: null, // SoundCloud tracks don't have local files
      artwork: track.artwork,
      genre: track.genre,
      soundcloud: true,
    };

    onTracksAdd([playerTrack]);
    toast({
      title: "Track added",
      description: `"${track.name}" has been added to your playlist.`,
    });
  };

  const addAllTracks = () => {
    const playerTracks = tracks.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artist,
      duration: track.duration,
      url: track.url,
      file: null,
      artwork: track.artwork,
      genre: track.genre,
      soundcloud: true,
    }));

    onTracksAdd(playerTracks);
    toast({
      title: "All tracks added",
      description: `${tracks.length} tracks have been added to your playlist.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cloud className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">SoundCloud</h3>
          {isConnected && <Badge variant="secondary">Connected</Badge>}
        </div>
        
        {isConnected ? (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTracks}
              disabled={isLoadingTracks}
            >
              {isLoadingTracks ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={connectToSoundCloud}
            disabled={isLoading}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            Connect
          </Button>
        )}
      </div>

      {isConnected && tracks.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {tracks.length} tracks available
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={addAllTracks}
            >
              <Music className="h-4 w-4 mr-2" />
              Add All
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {tracks.map((track) => (
              <Card key={track.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{track.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist}
                    </p>
                    {track.genre && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {track.genre}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addTrackToPlayer(track)}
                  >
                    <Music className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isConnected && tracks.length === 0 && !isLoadingTracks && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No tracks found. Make sure you have tracks uploaded to your SoundCloud account.
        </p>
      )}
    </div>
  );
};