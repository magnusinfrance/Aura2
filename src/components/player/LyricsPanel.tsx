import React, { useEffect } from 'react';
import { Track } from '../MusicPlayer';
import { useLyrics } from '@/hooks/useLyrics';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Music, RefreshCw, X } from 'lucide-react';

interface LyricsPanelProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LyricsPanel: React.FC<LyricsPanelProps> = ({ 
  track, 
  isOpen, 
  onClose 
}) => {
  const { lyrics, isLoading, searchLyrics, clearLyrics } = useLyrics();

  useEffect(() => {
    if (isOpen && track && track.artist && track.name) {
      searchLyrics(track.artist, track.name);
    } else if (!isOpen) {
      clearLyrics();
    }
  }, [track, isOpen, searchLyrics, clearLyrics]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    if (track && track.artist && track.name) {
      searchLyrics(track.artist, track.name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Lyrics</h3>
              {track && (
                <p className="text-sm text-muted-foreground">
                  {track.name} {track.artist && `• ${track.artist}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {!track ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No track selected</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : lyrics?.error ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{lyrics.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : lyrics?.lyrics ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-mono">
                  {lyrics.lyrics}
                </pre>
                {lyrics.source && (
                  <div className="text-xs text-muted-foreground pt-4 border-t">
                    Source: {lyrics.source}
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No lyrics available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};