import React, { useState, useEffect } from 'react';
import { Track } from '../MusicPlayer';
import { Disc3, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AlbumArtProps {
  track: Track | null;
  isPlaying: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AlbumArt: React.FC<AlbumArtProps> = ({ 
  track, 
  isPlaying, 
  size = 'md' 
}) => {
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-24 w-24'
  };

  useEffect(() => {
    if (track?.file) {
      extractAlbumArt(track.file);
    }
  }, [track]);

  const extractAlbumArt = async (file: File) => {
    try {
      // Try to extract embedded album art
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Simple ID3v2 album art extraction
      if (uint8Array[0] === 0x49 && uint8Array[1] === 0x44 && uint8Array[2] === 0x33) {
        // ID3v2 header found
        const artData = extractID3AlbumArt(uint8Array);
        if (artData) {
          const blob = new Blob([artData], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          setAlbumArt(url);
          return;
        }
      }
      
      // If no embedded art, try MusicBrainz
      searchMusicBrainz(track?.name || '', track?.artist || '');
    } catch (error) {
      console.error('Error extracting album art:', error);
    }
  };

  const extractID3AlbumArt = (data: Uint8Array): Uint8Array | null => {
    try {
      // Basic ID3v2 APIC frame search
      let offset = 10; // Skip ID3v2 header
      
      while (offset < data.length - 10) {
        if (data[offset] === 0x41 && data[offset + 1] === 0x50 && 
            data[offset + 2] === 0x49 && data[offset + 3] === 0x43) {
          // APIC frame found
          const frameSize = (data[offset + 4] << 24) | (data[offset + 5] << 16) | 
                           (data[offset + 6] << 8) | data[offset + 7];
          
          // Skip frame header and find JPEG start
          let imgOffset = offset + 10;
          while (imgOffset < offset + frameSize && 
                 !(data[imgOffset] === 0xFF && data[imgOffset + 1] === 0xD8)) {
            imgOffset++;
          }
          
          if (data[imgOffset] === 0xFF && data[imgOffset + 1] === 0xD8) {
            // JPEG found
            return data.slice(imgOffset, offset + frameSize);
          }
        }
        offset++;
      }
    } catch (error) {
      console.error('Error parsing ID3:', error);
    }
    return null;
  };

  const searchMusicBrainz = async (title: string, artist: string) => {
    if (!title || !artist) return;
    
    setIsLoading(true);
    try {
      // Search for the recording
      const searchUrl = `https://musicbrainz.org/ws/2/recording?query=recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"&fmt=json&limit=1`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) throw new Error('MusicBrainz search failed');
      
      const data = await response.json();
      
      if (data.recordings && data.recordings.length > 0) {
        const recording = data.recordings[0];
        
        if (recording.releases && recording.releases.length > 0) {
          const releaseId = recording.releases[0].id;
          
          // Get cover art from Cover Art Archive
          const artUrl = `https://coverartarchive.org/release/${releaseId}/front-250`;
          
          try {
            const artResponse = await fetch(artUrl);
            if (artResponse.ok) {
              const blob = await artResponse.blob();
              const url = URL.createObjectURL(blob);
              setAlbumArt(url);
              
              toast({
                title: "Album art found",
                description: `Downloaded cover art for "${title}"`,
              });
            }
          } catch (artError) {
            console.log('No cover art available for this release');
          }
        }
      }
    } catch (error) {
      console.error('MusicBrainz search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAlbumArt = () => {
    if (!albumArt || !track) return;
    
    const a = document.createElement('a');
    a.href = albumArt;
    a.download = `${track.name}-albumart.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Album art downloaded",
      description: "The album art has been saved to your downloads.",
    });
  };

  if (!track) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-primary rounded-lg flex items-center justify-center`}>
        <Disc3 className={`${iconSizes[size]} text-primary-foreground opacity-50`} />
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`
        ${sizeClasses[size]} bg-gradient-primary rounded-lg flex items-center justify-center overflow-hidden
        ${isPlaying ? 'animate-pulse-glow' : ''}
      `}>
        {albumArt ? (
          <img
            src={albumArt}
            alt={`${track.name} album art`}
            className={`${sizeClasses[size]} object-cover rounded-lg ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}
          />
        ) : (
          <Disc3 className={`${iconSizes[size]} text-primary-foreground ${
            isPlaying ? 'animate-spin-slow' : ''
          } ${isLoading ? 'animate-pulse' : ''}`} />
        )}
      </div>
      
      {isPlaying && (
        <div className="absolute -inset-1 bg-gradient-accent rounded-lg blur opacity-30 animate-pulse-glow -z-10" />
      )}
      
      {/* Hover actions */}
      {albumArt && size !== 'sm' && (
        <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={downloadAlbumArt}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};