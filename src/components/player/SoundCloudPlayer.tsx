import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../MusicPlayer';

interface SoundCloudPlayerProps {
  track: Track;
  isPlaying: boolean;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
}

declare global {
  interface Window {
    SC: any;
  }
}

export const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({
  track,
  isPlaying,
  volume,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load SoundCloud Widget API
    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = () => {
        initializeWidget();
      };
      document.head.appendChild(script);
    } else {
      initializeWidget();
    }
  }, [track]);

  const initializeWidget = () => {
    if (!iframeRef.current) return;

    // Initialize SoundCloud widget
    widgetRef.current = window.SC.Widget(iframeRef.current);
    
    widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
      setIsLoaded(true);
      
      // Set up event listeners
      widgetRef.current.bind(window.SC.Widget.Events.PLAY, onPlay);
      widgetRef.current.bind(window.SC.Widget.Events.PAUSE, onPause);
      widgetRef.current.bind(window.SC.Widget.Events.FINISH, onEnded);
      
      widgetRef.current.bind(window.SC.Widget.Events.PLAY_PROGRESS, (data: any) => {
        onTimeUpdate(data.currentPosition / 1000, data.duration / 1000);
      });

      // Set initial volume
      widgetRef.current.setVolume(volume * 100);
    });
  };

  useEffect(() => {
    if (widgetRef.current && isLoaded) {
      if (isPlaying) {
        widgetRef.current.play();
      } else {
        widgetRef.current.pause();
      }
    }
  }, [isPlaying, isLoaded]);

  useEffect(() => {
    if (widgetRef.current && isLoaded) {
      widgetRef.current.setVolume(volume * 100);
    }
  }, [volume, isLoaded]);

  const generateEmbedUrl = (trackUrl: string): string => {
    const params = new URLSearchParams({
      url: trackUrl,
      color: '#ff5500',
      auto_play: 'false',
      hide_related: 'false',
      show_comments: 'true',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'true',
      visual: 'true'
    });
    
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  };

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={generateEmbedUrl(track.url)}
        className="rounded-lg"
      />
    </div>
  );
};