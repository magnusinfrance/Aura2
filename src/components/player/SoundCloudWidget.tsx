import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Cloud, Plus, ExternalLink, Search } from 'lucide-react';

interface SoundCloudWidgetProps {
  onTrackAdd: (track: any) => void;
}

export const SoundCloudWidget: React.FC<SoundCloudWidgetProps> = ({ onTrackAdd }) => {
  const [url, setUrl] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const extractSoundCloudId = (url: string): string | null => {
    // Match various SoundCloud URL patterns
    const patterns = [
      /soundcloud\.com\/([^\/]+\/[^\/\?]+)/,
      /soundcloud\.com\/([^\/]+\/sets\/[^\/\?]+)/,
      /m\.soundcloud\.com\/([^\/]+\/[^\/\?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const generateEmbedUrl = (trackPath: string): string => {
    return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackPath}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
  };

  const handleAddTrack = async () => {
    if (!url.trim()) {
      toast({
        variant: "destructive",
        title: "URL required",
        description: "Please enter a SoundCloud URL",
      });
      return;
    }

    // Validate SoundCloud URL
    if (!url.includes('soundcloud.com')) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid SoundCloud URL",
      });
      return;
    }

    // Check if it's a playlist/set URL
    if (url.includes('/sets/')) {
      toast({
        variant: "destructive",
        title: "Playlist URLs not supported",
        description: "Please copy individual track URLs from the playlist instead. Click the track names to get their URLs.",
      });
      return;
    }

    // Check if it's an artist profile URL
    if (url.match(/soundcloud\.com\/[^\/]+\/?$/) && !url.includes('/tracks/')) {
      toast({
        variant: "destructive", 
        title: "Artist profile URLs not supported",
        description: "Please copy individual track URLs from the artist's page instead.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const trackPath = extractSoundCloudId(url);
      if (!trackPath) {
        throw new Error('Please use individual track URLs, not playlists or artist profiles');
      }

      // Additional validation for track URLs
      if (!trackPath.includes('/')) {
        throw new Error('Invalid track URL format');
      }

      // Extract basic info from URL for display
      const urlParts = trackPath.split('/');
      const artist = urlParts[0] || 'Unknown Artist';
      const trackName = urlParts[1]?.replace(/-/g, ' ') || 'Unknown Track';

      // Create a track object for the playlist
      const soundCloudTrack = {
        id: `sc-${Date.now()}`,
        name: trackName.charAt(0).toUpperCase() + trackName.slice(1),
        artist: artist.charAt(0).toUpperCase() + artist.slice(1),
        duration: 0, // Will be updated when iframe loads
        url: url,
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`,
        soundcloud: true,
        artwork: null, // SoundCloud widget will show artwork
      };

      onTrackAdd(soundCloudTrack);
      setUrl('');
      
      toast({
        title: "SoundCloud track added",
        description: `"${soundCloudTrack.name}" by ${soundCloudTrack.artist} added to playlist`,
      });

    } catch (error: any) {
      console.error('SoundCloud error:', error);
      toast({
        variant: "destructive",
        title: "Failed to add track",
        description: error.message || "Could not add SoundCloud track",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArtistSearch = () => {
    if (!artistSearch.trim()) {
      toast({
        variant: "destructive",
        title: "Artist name required",
        description: "Please enter an artist name to search",
      });
      return;
    }

    // Open SoundCloud search in a new tab
    const searchQuery = encodeURIComponent(artistSearch.trim());
    const searchUrl = `https://soundcloud.com/search/people?q=${searchQuery}`;
    window.open(searchUrl, '_blank');

    toast({
      title: "Opening SoundCloud search",
      description: `Searching for "${artistSearch}" - copy track URLs from the results!`,
    });
  };

  const handleArtistKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleArtistSearch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTrack();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Cloud className="h-5 w-5 text-orange-500" />
        <h4 className="font-medium">SoundCloud</h4>
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </div>
      
      <div className="flex space-x-2">
        <Input
          placeholder="Paste individual SoundCloud track URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          className="bg-player-elevated border-border"
        />
        <Button
          onClick={handleAddTrack}
          disabled={isLoading || !url.trim()}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Artist Search */}
      <div className="flex space-x-2">
        <Input
          placeholder="Search for artist on SoundCloud..."
          value={artistSearch}
          onChange={(e) => setArtistSearch(e.target.value)}
          onKeyPress={handleArtistKeyPress}
          className="bg-player-elevated border-border"
        />
        <Button
          onClick={handleArtistSearch}
          disabled={!artistSearch.trim()}
          size="sm"
          variant="outline"
          className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        <strong>Individual track URLs only</strong> • For playlists: click individual track names to get their URLs
      </p>
    </div>
  );
};