import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LyricsData {
  lyrics: string;
  source: string;
  error?: string;
}

export const useLyrics = () => {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchLyrics = useCallback(async (artist: string, title: string) => {
    if (!artist || !title) {
      setLyrics({ lyrics: '', source: '', error: 'Artist and title are required' });
      return;
    }

    setIsLoading(true);
    setLyrics(null);

    try {
      // For demo purposes, provide sample lyrics or useful information
      // In a real app, you'd need a backend service to fetch lyrics due to CORS
      
      const sampleLyrics = getSampleLyrics(artist, title);
      
      if (sampleLyrics) {
        setLyrics({
          lyrics: sampleLyrics,
          source: 'sample'
        });
        toast({
          title: "Sample lyrics displayed",
          description: `Showing sample content for "${title}"`,
        });
      } else {
        setLyrics({
          lyrics: `🎵 "${title}" by ${artist} 🎵\n\n[Lyrics would appear here]\n\nTo implement lyrics in production:\n\n1. Set up a backend service to proxy lyrics APIs\n2. Use services like:\n   • Musixmatch API\n   • Genius API  \n   • LyricFind API\n   • AZLyrics scraping\n\n3. Handle rate limiting and caching\n4. Implement fallback sources\n\nThis avoids CORS issues and provides\nreliable lyrics access for your users.`,
          source: 'demo'
        });
        
        toast({
          title: "Demo lyrics",
          description: "Production implementation would fetch real lyrics via backend",
        });
      }
    } catch (error) {
      console.error('Error in lyrics display:', error);
      setLyrics({
        lyrics: `🎵 "${title}" by ${artist} 🎵\n\n[No lyrics available]\n\nThis is a demo music player.\nIn production, lyrics would be fetched\nfrom a backend service.`,
        source: 'fallback'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Sample lyrics for demo purposes
  const getSampleLyrics = (artist: string, title: string): string | null => {
    const lowerTitle = title.toLowerCase();
    const lowerArtist = artist.toLowerCase();
    
    // Add some sample lyrics for common demo tracks
    if (lowerTitle.includes('nothing') || lowerTitle.includes('replace')) {
      return `🎵 Nothing Can Replace (Sample) 🎵

[Verse 1]
In the silence of the night
When the world fades from sight
I hear echoes of your voice
Calling out, I have no choice

[Chorus]
Nothing can replace
The memories we made
Every word you said
Still echoes in my head
Nothing can replace
The love that cannot fade

[Verse 2]
Time may heal the deepest scars
But you're written in the stars
Every sunset, every dawn
Reminds me you're not gone

[Chorus]
Nothing can replace
The memories we made
Every word you said
Still echoes in my head
Nothing can replace
The love that cannot fade

[Bridge]
Though you're gone, I carry on
With the strength that you gave me
In my heart, you'll never part
You're my greatest legacy

[Final Chorus]
Nothing can replace
The memories we made
Every word you said
Still echoes in my head
Nothing can replace
The love that cannot fade

---
Note: This is sample content for demo purposes.
Production app would fetch real lyrics via backend API.`;
    }
    
    return null;
  };

  const clearLyrics = useCallback(() => {
    setLyrics(null);
  }, []);

  return {
    lyrics,
    isLoading,
    searchLyrics,
    clearLyrics
  };
};