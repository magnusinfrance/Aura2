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
      const response = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
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

      // Fallback: try a different approach with Genius-style search
      try {
        const searchResponse = await fetch(
          `https://api.genius.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`
        );
        
        if (searchResponse.ok) {
          // Note: This is a placeholder for Genius API integration
          // In a real implementation, you'd need a Genius API key
          setLyrics({
            lyrics: 'Lyrics not available from our sources.',
            source: 'manual',
            error: 'No lyrics found from available sources'
          });
        } else {
          throw new Error('No lyrics sources available');
        }
      } catch (fallbackError) {
        setLyrics({
          lyrics: '',
          source: '',
          error: 'Unable to fetch lyrics. Please check your internet connection.'
        });
      }
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