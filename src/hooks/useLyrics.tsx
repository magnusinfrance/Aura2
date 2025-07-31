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
      // Try Lyrics.ovh API first (free, no key required)
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const response = await fetch(
        `${proxyUrl}https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        {
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.lyrics) {
          setLyrics({
            lyrics: data.lyrics.trim(),
            source: 'lyrics.ovh'
          });
          toast({
            title: "Lyrics found",
            description: `Found lyrics for "${title}" by ${artist}`,
          });
          return;
        }
      }

      // Fallback: Simple placeholder since CORS will likely block external APIs
      setLyrics({
        lyrics: `Sorry, lyrics are not available for "${title}" by ${artist}.\n\nThis feature requires a backend service to bypass CORS restrictions.\n\nIn a production app, you would typically:\n- Set up a backend proxy to fetch lyrics\n- Use an API key with proper authentication\n- Implement fallback sources for better coverage`,
        source: 'info',
        error: 'CORS restriction - requires backend proxy'
      });

      toast({
        title: "Lyrics unavailable",
        description: "This demo has limited lyrics access due to CORS restrictions",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      setLyrics({
        lyrics: '',
        source: '',
        error: 'Failed to fetch lyrics. Please try again later.'
      });
      
      toast({
        title: "Lyrics not found",
        description: `Could not find lyrics for "${title}" by ${artist}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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