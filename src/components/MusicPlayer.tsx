import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerControls } from './player/PlayerControls';
import { TrackList } from './player/TrackList';
import { NowPlaying } from './player/NowPlaying';
import { EnhancedVisualizer } from './player/EnhancedVisualizer';
import { FileManager } from './player/FileManager';
import { RightSidePlaylist } from './player/RightSidePlaylist';
import { AlbumArt } from './player/AlbumArt';
import { ThemeSelector } from './player/ThemeSelector';
import { LayoutSelector } from './player/LayoutSelector';
import { LeftSidePlaylist } from './player/LeftSidePlaylist';
import { CompactNowPlaying } from './player/CompactNowPlaying';
import { SettingsPanel } from './player/SettingsPanel';
import { EnhancedAudioEffects } from './player/EnhancedAudioEffects';
import { EqualizerPopup } from './player/EqualizerPopup';
import { SharedAudioProcessorProvider, useSharedAudioProcessor } from './player/SharedAudioProcessor';
import { QueueManager } from './player/QueueManager';

import { TrackListMinimal } from './player/TrackListMinimal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAudioMetadata } from '@/hooks/useAudioMetadata';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useAudioEffects } from '@/hooks/useAudioEffects';
import { Settings, Maximize2, Minimize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import auraLogo from '@/assets/aura-logo-transparent.png';

export interface Track {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  duration?: number;
  url: string;
  file?: File | null;
  artwork?: string;
  genre?: string;
  soundcloud?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: Date;
}

interface MusicPlayerContentProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

const MusicPlayerContent: React.FC<MusicPlayerContentProps> = ({ audioRef }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'album'>('list');
  const [currentPlaylistQueue, setCurrentPlaylistQueue] = useState<Track[]>([]);
  const [layout, setLayout] = useState<'standard' | 'compact' | 'mini' | 'widescreen' | 'focus'>('standard');
  const [outputGain, setOutputGain] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.7);

  const { extractMetadata } = useAudioMetadata();
  const { toast } = useToast();
  const { updateThemeFromAlbumArt, resetTheme } = useDynamicTheme();
  const {
    fadeIn,
    fadeOut,
    playWithFadeIn,
    stopWithFadeOut,
    updateConfig,
    setAudioRef,
    prepareGaplessPlayback,
    switchToNextTrack,
    config: audioEffectsConfig
  } = useAudioEffects();
  
  // Get analyser from shared audio processor
  const { analyserNode, audioContext, masterGainNode } = useSharedAudioProcessor();

  // Initialize audio effects
  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef.current);
    }
  }, [setAudioRef]);

  // Update theme when track changes
  useEffect(() => {
    if (currentTrack?.artwork) {
      updateThemeFromAlbumArt(currentTrack.artwork);
    } else {
      resetTheme();
    }
  }, [currentTrack?.artwork, updateThemeFromAlbumArt, resetTheme]);

  const handleVolumeUp = useCallback(() => {
    setVolume(prev => Math.min(1, prev + 0.1));
  }, []);

  const handleVolumeDown = useCallback(() => {
    setVolume(prev => Math.max(0, prev - 0.1));
  }, []);

  const handleMute = useCallback(() => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, previousVolume]);

  const handleSeekForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        duration,
        audioRef.current.currentTime + 10
      );
    }
  }, [duration]);

  const handleSeekBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime - 10
      );
    }
  }, []);


  const handleQueueReorder = useCallback((reorderedTracks: Track[]) => {
    setCurrentPlaylistQueue(reorderedTracks);
  }, []);

  const handleRemoveFromQueue = useCallback((track: Track) => {
    setCurrentPlaylistQueue(prev => prev.filter(t => t.id !== track.id));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = async () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        try {
          await audio.play();
        } catch (error) {
          console.warn('Repeat play failed:', error);
          setIsPlaying(false);
        }
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Apply output gain to master gain node
  useEffect(() => {
    if (masterGainNode) {
      masterGainNode.gain.value = outputGain;
    }
  }, [outputGain, masterGainNode]);

  const playTrack = useCallback(async (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    // Handle SoundCloud tracks
    if (track.soundcloud) {
      // Pause any regular audio that might be playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      // SoundCloud tracks will be handled by the SoundCloudPlayer component
      return;
    }
    
    // Handle regular audio files - pause any SoundCloud that might be playing
    // (SoundCloud will be paused via the component's useEffect when isPlaying changes)
    if (audioRef.current) {
      audioRef.current.src = track.url;
      
      try {
        // Use fade in effect if enabled
        if (audioEffectsConfig.fadeInDuration > 0) {
          await playWithFadeIn(audioRef.current);
        } else {
          await audioRef.current.play();
        }
        
        // Prepare next track for gapless playback
        const sourceList = currentPlaylistQueue.length > 0 ? currentPlaylistQueue : tracks;
        const currentIndex = sourceList.findIndex(t => t.id === track.id);
        const nextTrack = sourceList[currentIndex + 1];
        if (nextTrack && !nextTrack.soundcloud) {
          prepareGaplessPlayback(nextTrack.url);
        }
      } catch (error) {
        console.warn('Play failed:', error);
        setIsPlaying(false);
      }
    }
  }, [playWithFadeIn, audioEffectsConfig.fadeInDuration, prepareGaplessPlayback, currentPlaylistQueue, tracks]);

  const togglePlayPause = async () => {
    if (!currentTrack) return;
    
    // Handle SoundCloud tracks
    if (currentTrack.soundcloud) {
      // Ensure regular audio is paused
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      // SoundCloud playback will be handled by the SoundCloudPlayer component
      setIsPlaying(!isPlaying);
      return;
    }
    
    // Handle regular audio files
    if (audioRef.current) {
      try {
        if (isPlaying) {
          // Always pause immediately on manual stop/pause for responsiveness
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          // Use fade in effect if enabled
          if (audioEffectsConfig.fadeInDuration > 0) {
            await playWithFadeIn(audioRef.current);
          } else {
            await audioRef.current.play();
          }
          setIsPlaying(true);
        }
      } catch (error) {
        console.warn('Play failed:', error);
        setIsPlaying(false);
      }
    }
  };

  const handleNext = () => {
    // Use queue if it exists, otherwise use main tracks
    const sourceList = currentPlaylistQueue.length > 0 ? currentPlaylistQueue : tracks;
    if (!currentTrack || sourceList.length === 0) return;
    
    const currentIndex = sourceList.findIndex(t => t.id === currentTrack.id);
    let nextIndex;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * sourceList.length);
    } else {
      nextIndex = (currentIndex + 1) % sourceList.length;
    }
    
    if (repeatMode === 'none' && currentIndex === sourceList.length - 1) {
      setIsPlaying(false);
      return;
    }
    
    playTrack(sourceList[nextIndex]);
  };

  const handlePrevious = () => {
    const sourceList = currentPlaylistQueue.length > 0 ? currentPlaylistQueue : tracks;
    if (!currentTrack || sourceList.length === 0) return;
    
    const currentIndex = sourceList.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? sourceList.length - 1 : currentIndex - 1;
    
    playTrack(sourceList[prevIndex]);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addFiles = useCallback(async (files: any[]) => {
    // Handle both File objects and SoundCloud tracks
    const newTracks: Track[] = await Promise.all(files.map(async (fileOrTrack) => {
      // If it's already a track object (from SoundCloud), use it directly
      if (typeof fileOrTrack === 'object' && fileOrTrack.id && fileOrTrack.url && !fileOrTrack.type) {
        return fileOrTrack;
      }
      
      // If it's a File object, process normally
      const file = fileOrTrack as File;
      const url = URL.createObjectURL(file);
      
      // Extract full metadata including artist, album, and album art
      const metadata = await extractMetadata(file);
      
      return {
        id: Math.random().toString(36),
        name: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: metadata.artist,
        album: metadata.album,
        duration: metadata.duration,
        url,
        file,
      };
    }));
    
    setTracks(prev => [...prev, ...newTracks]);
    // Automatically add to queue
    setCurrentPlaylistQueue(prev => [...prev, ...newTracks]);
  }, [extractMetadata]);

  const addSingleTrack = useCallback((track: Track) => {
    addFiles([track]);
  }, [addFiles]);

  const clearMusicLibrary = useCallback(() => {
    setTracks([]);
    setCurrentPlaylistQueue([]);
    setCurrentTrack(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    toast({
      title: "Music library cleared",
      description: "All tracks have been removed from your library",
    });
  }, []);

  const handleSoundCloudPlay = useCallback(() => {
    // Ensure regular audio is paused when SoundCloud starts
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(true);
  }, []);

  const handleSoundCloudPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleSoundCloudEnded = useCallback(() => {
    setIsPlaying(false);
    handleNext();
  }, []);

  const handleSoundCloudTimeUpdate = useCallback((currentTime: number, duration: number) => {
    setCurrentTime(currentTime);
    setDuration(duration);
  }, []);

  const handleSavePlaylist = (name: string, tracks: Track[]) => {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36),
      name,
      tracks,
      createdAt: new Date(),
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  // Setup keyboard shortcuts after all handlers are defined
  useKeyboardShortcuts({
    onPlayPause: togglePlayPause,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    onMute: handleMute,
    onShuffle: () => setIsShuffled(!isShuffled),
    onRepeat: () => {
      const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
      const currentIndex = modes.indexOf(repeatMode);
      setRepeatMode(modes[(currentIndex + 1) % modes.length]);
    },
    onSeekForward: handleSeekForward,
    onSeekBackward: handleSeekBackward,
  });

  if (layout === 'mini') {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-player-surface/95 backdrop-blur-lg border border-border rounded-lg shadow-2xl">
        <audio ref={audioRef} />
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <AlbumArt track={currentTrack} isPlaying={isPlaying} size="sm" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {currentTrack?.name || 'No track'}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack?.artist || 'Select a song'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayout('standard')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Mini Visualizer */}
          <div className="h-16 mb-3 rounded overflow-hidden">
            <EnhancedVisualizer 
              analyser={analyserNode}
              isPlaying={isPlaying}
            />
          </div>
          
          <PlayerControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isShuffled={isShuffled}
            repeatMode={repeatMode}
            onPlayPause={togglePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSeek={handleSeek}
            onVolumeChange={setVolume}
            onShuffleToggle={() => setIsShuffled(!isShuffled)}
            onRepeatToggle={() => {
              const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
              const currentIndex = modes.indexOf(repeatMode);
              setRepeatMode(modes[(currentIndex + 1) % modes.length]);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-secondary p-2 space-y-2 pb-20">
      <audio ref={audioRef} />
      
      {/* Compact Header */}
      <div className="bg-gradient-primary p-2 text-white shadow-player rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center">
            <h1 className="text-lg font-bold">AUR:A Music Media Player</h1>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-1">
            <SettingsPanel 
              layout={layout} 
              setLayout={setLayout}
              audioElement={audioRef.current}
              audioContext={audioContext}
              analyser={analyserNode}
              outputGain={outputGain}
              onOutputGainChange={setOutputGain}
              onFilesAdd={addFiles}
              onClearLibrary={clearMusicLibrary}
              fadeInDuration={audioEffectsConfig.fadeInDuration}
              fadeOutDuration={audioEffectsConfig.fadeOutDuration}
              crossfadeDuration={audioEffectsConfig.crossfadeDuration}
              gaplessPlayback={audioEffectsConfig.gaplessPlayback}
              onFadeInChange={(value) => updateConfig({ fadeInDuration: value })}
              onFadeOutChange={(value) => updateConfig({ fadeOutDuration: value })}
              onCrossfadeChange={(value) => updateConfig({ crossfadeDuration: value })}
              onGaplessToggle={(value) => updateConfig({ gaplessPlayback: value })}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayout('mini')}
              className="h-7 w-7 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout - Fully Responsive */}
      <div className={`${
        layout === 'widescreen' ? 'w-full px-2' : 'w-full max-w-none px-2'
      } ${
        layout === 'compact' || layout === 'focus' ? 'space-y-4' : 'grid grid-cols-12 gap-4 min-h-[calc(100vh-8rem)]'
      }`}>
        {layout === 'compact' ? (
          // Compact Layout
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-player-surface border-border p-4">
                <FileManager onFilesAdd={addFiles} onTrackAdd={addSingleTrack} />
              </Card>
              
              <Card className="bg-player-surface border-border overflow-hidden">
                <CompactNowPlaying 
                  track={currentTrack} 
                  isPlaying={isPlaying} 
                  analyser={analyserNode}
                />
              </Card>
              
            </div>
            
            <QueueManager
              tracks={currentPlaylistQueue.length > 0 ? currentPlaylistQueue : tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={playTrack}
              onTrackRemove={handleRemoveFromQueue}
              onReorder={handleQueueReorder}
              trackListView="list"
            />
          </>
        ) : layout === 'focus' ? (
          // Focus Layout - Minimalist design for distraction-free listening
          <>
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <Card className="bg-player-surface border-border overflow-hidden">
                <div className="relative overflow-hidden">
                  {/* Background Visualizer */}
                  <div className="absolute inset-0">
                    <EnhancedVisualizer 
                      analyser={analyserNode}
                      isPlaying={isPlaying}
                    />
                  </div>
                  <div className="relative z-10 p-12">
                    <div className="mx-auto mb-8">
                      <AlbumArt track={currentTrack} isPlaying={isPlaying} size="lg" />
                    </div>
                    
                    <div className="space-y-4">
                      <h1 className="text-4xl font-bold text-foreground drop-shadow-sm">
                        {currentTrack?.name || 'No track selected'}
                      </h1>
                      <p className="text-2xl text-muted-foreground drop-shadow-sm">
                        {currentTrack?.artist || 'Unknown Artist'}
                      </p>
                      <p className="text-lg text-muted-foreground/70 drop-shadow-sm">
                        {currentTrack?.album || 'Unknown Album'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
              
            </div>
          </>
        ) : layout === 'widescreen' ? (
          // Widescreen Layout - Optimized for wide displays
          <>
            {/* Top Row - File Manager and Now Playing */}
            <div className="col-span-12 grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-3">
                <Card className="bg-player-surface border-border p-4">
                  <FileManager onFilesAdd={addFiles} onTrackAdd={addSingleTrack} />
                </Card>
              </div>
              
              <div className="col-span-9">
                <Card className="bg-player-surface border-border overflow-hidden">
                  <NowPlaying 
                    track={currentTrack} 
                    isPlaying={isPlaying} 
                    analyser={analyserNode}
                    onSoundCloudPlay={handleSoundCloudPlay}
                    onSoundCloudPause={handleSoundCloudPause}
                    onSoundCloudEnded={handleSoundCloudEnded}
                    onSoundCloudTimeUpdate={handleSoundCloudTimeUpdate}
                    volume={volume}
                  />
                </Card>
              </div>
            </div>
            
            {/* Bottom Row - Track List and Playlist */}
            <div className="col-span-12 grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <Card className="bg-player-surface border-border">
                  <TrackList 
                    tracks={tracks}
                    currentTrack={currentTrack}
                    onTrackSelect={playTrack}
                    viewMode="list"
                  />
                </Card>
              </div>
              
              <div className="col-span-4">
                <Card className="bg-player-surface border-border">
                  <RightSidePlaylist
                    currentPlaylist={currentPlaylistQueue}
                    setCurrentPlaylist={setCurrentPlaylistQueue}
                    allTracks={tracks}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onTrackSelect={playTrack}
                    onNext={handleNext}
                    isShuffled={isShuffled}
                    onShuffleToggle={() => setIsShuffled(!isShuffled)}
                    onSavePlaylist={handleSavePlaylist}
                  />
                </Card>
              </div>
            </div>
          </>
        ) : (
          // Standard Layout - Balanced three-column design
          <>
            {/* Left Side - File Manager */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <Card className="bg-player-surface border-border p-4">
                <FileManager onFilesAdd={addFiles} onTrackAdd={addSingleTrack} />
              </Card>
            </div>

            {/* Center Content */}
            <div className="col-span-12 lg:col-span-6 space-y-4">
              {/* Now Playing with Visualizer */}
              <Card className="bg-player-surface border-border">
                <NowPlaying 
                  track={currentTrack} 
                  isPlaying={isPlaying} 
                  analyser={analyserNode}
                  onSoundCloudPlay={handleSoundCloudPlay}
                  onSoundCloudPause={handleSoundCloudPause}
                  onSoundCloudEnded={handleSoundCloudEnded}
                  onSoundCloudTimeUpdate={handleSoundCloudTimeUpdate}
                  volume={volume}
                />
              </Card>

              {/* Track List */}
              <Card className="bg-player-surface border-border flex-1 relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-30 bg-center bg-no-repeat bg-contain"
                  style={{ backgroundImage: `url(/lovable-uploads/db049072-b49c-43cc-8c24-20f9689b97c9.png)` }}
                />
                 <div className="relative z-10">
                  <TrackList 
                    tracks={tracks}
                    currentTrack={currentTrack}
                    onTrackSelect={playTrack}
                    viewMode="list"
                  />
                </div>
              </Card>
            </div>

            {/* Right Side - Playlist/Queue */}
            <div className="col-span-12 lg:col-span-3">
              <Card className="bg-player-surface border-border h-full">
                <LeftSidePlaylist
                  currentPlaylist={currentPlaylistQueue}
                  setCurrentPlaylist={setCurrentPlaylistQueue}
                  allTracks={tracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onTrackSelect={playTrack}
                  onNext={handleNext}
                  isShuffled={isShuffled}
                  onShuffleToggle={() => setIsShuffled(!isShuffled)}
                  onSavePlaylist={handleSavePlaylist}
                />
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Bottom Player Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-player-surface/95 backdrop-blur-lg border-t border-border z-40">
        <PlayerControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isShuffled={isShuffled}
          repeatMode={repeatMode}
          onPlayPause={togglePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSeek={handleSeek}
          onVolumeChange={setVolume}
          onShuffleToggle={() => setIsShuffled(!isShuffled)}
          onRepeatToggle={() => {
            const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
            const currentIndex = modes.indexOf(repeatMode);
            setRepeatMode(modes[(currentIndex + 1) % modes.length]);
          }}
        />
      </div>

    </div>
  );
};

const MusicPlayerWrapper: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
  }, []);

  return (
    <SharedAudioProcessorProvider audioElement={audioElement}>
      <MusicPlayerContent audioRef={audioRef} />
    </SharedAudioProcessorProvider>
  );
};

export const MusicPlayer: React.FC = () => {
  return (
    <ThemeProvider>
      <MusicPlayerWrapper />
    </ThemeProvider>
  );
};