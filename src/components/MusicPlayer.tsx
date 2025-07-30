import React, { useState, useRef, useEffect } from 'react';
import { PlayerControls } from './player/PlayerControls';
import { TrackList } from './player/TrackList';
import { NowPlaying } from './player/NowPlaying';
import { EnhancedVisualizer } from './player/EnhancedVisualizer';
import { FileManager } from './player/FileManager';
import { PlaylistManager } from './player/PlaylistManager';
import { RightSidePlaylist } from './player/RightSidePlaylist';
import { AlbumArt } from './player/AlbumArt';
import { ThemeSelector } from './player/ThemeSelector';
import { LayoutSelector } from './player/LayoutSelector';
import { LeftSidePlaylist } from './player/LeftSidePlaylist';
import { CompactNowPlaying } from './player/CompactNowPlaying';
import { SettingsPanel } from './player/SettingsPanel';
import { EnhancedAudioEffects } from './player/EnhancedAudioEffects';
import { EqualizerPopup } from './player/EqualizerPopup';
import { AudioProcessorProvider } from './player/AudioProcessor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/hooks/useTheme';
import { Settings, Maximize2, Minimize2 } from 'lucide-react';
import auraLogo from '@/assets/aura-logo-transparent.png';

export interface Track {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  duration?: number;
  url: string;
  file: File;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: Date;
}

const MusicPlayerContent: React.FC = () => {
  console.log('MusicPlayer component is rendering');
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
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


  const playTrack = (track: Track) => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      setCurrentTrack(track);
      setIsPlaying(true);
      audioRef.current.play();
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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

  const addFiles = async (files: File[]) => {
    const newTracks: Track[] = await Promise.all(files.map(async (file) => {
      const url = URL.createObjectURL(file);
      
      // Create audio element to get duration
      const audio = new Audio(url);
      const duration = await new Promise<number>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration || 0);
        });
        audio.addEventListener('error', () => {
          resolve(0);
        });
      });
      
      return {
        id: Math.random().toString(36),
        name: file.name.replace(/\.[^/.]+$/, ""),
        duration: duration,
        url,
        file,
      };
    }));
    
    setTracks(prev => [...prev, ...newTracks]);
    // Automatically add to queue
    setCurrentPlaylistQueue(prev => [...prev, ...newTracks]);
  };

  const handleSavePlaylist = (name: string, tracks: Track[]) => {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36),
      name,
      tracks,
      createdAt: new Date(),
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  };

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
    <div className="min-h-screen bg-gradient-secondary p-2 space-y-2 pb-20">
      <audio ref={audioRef} />
      
      {/* Compact Header */}
      <div className="bg-gradient-primary p-2 text-white shadow-player rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center">
            <h1 className="text-lg font-bold">AUR:A Music Media Player</h1>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-1">
            <SettingsPanel layout={layout} setLayout={setLayout} />
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

      {/* Main Layout */}
      <div className={`${
        layout === 'widescreen' ? 'max-w-full mx-4' : 'max-w-7xl mx-auto'
      } ${
        layout === 'compact' || layout === 'focus' ? 'space-y-4' : 'grid grid-cols-12 gap-4'
      }`}>
        {layout === 'compact' ? (
          // Compact Layout
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-player-surface border-border p-4">
                <FileManager onFilesAdd={addFiles} />
              </Card>
              
              <Card className="bg-player-surface border-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center space-x-4">
                    <AlbumArt track={currentTrack} isPlaying={isPlaying} size="md" />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold truncate">
                        {currentTrack?.name || 'No track selected'}
                      </h2>
                      <p className="text-muted-foreground truncate">
                        {currentTrack?.artist || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-player-surface border-border h-48">
                <EnhancedVisualizer 
                  isPlaying={isPlaying}
                />
              </Card>
            </div>
            
            <Card className="bg-player-surface border-border">
              <TrackList 
                tracks={tracks}
                currentTrack={currentTrack}
                onTrackSelect={playTrack}
                viewMode="list"
              />
            </Card>
          </>
        ) : layout === 'focus' ? (
          // Focus Layout - Minimalist design for distraction-free listening
          <>
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <Card className="bg-player-surface border-border overflow-hidden">
                <div className="p-12">
                  <div className="mx-auto mb-8">
                    <AlbumArt track={currentTrack} isPlaying={isPlaying} size="lg" />
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-foreground">
                      {currentTrack?.name || 'No track selected'}
                    </h1>
                    <p className="text-2xl text-muted-foreground">
                      {currentTrack?.artist || 'Unknown Artist'}
                    </p>
                    <p className="text-lg text-muted-foreground/70">
                      {currentTrack?.album || 'Unknown Album'}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-player-surface border-border h-32">
                <EnhancedVisualizer 
                  isPlaying={isPlaying}
                />
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
                  <FileManager onFilesAdd={addFiles} />
                </Card>
              </div>
              
              <div className="col-span-6">
                <Card className="bg-player-surface border-border overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center space-x-6">
                      <AlbumArt track={currentTrack} isPlaying={isPlaying} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-3xl font-bold text-foreground truncate">
                          {currentTrack?.name || 'No track selected'}
                        </h2>
                        <p className="text-xl text-muted-foreground truncate mt-2">
                          {currentTrack?.artist || 'Unknown Artist'}
                        </p>
                        <p className="text-lg text-muted-foreground/70 truncate mt-1">
                          {currentTrack?.album || 'Unknown Album'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              
              <div className="col-span-3">
                <Card className="bg-player-surface border-border h-full">
                  <EnhancedVisualizer 
                    isPlaying={isPlaying}
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
            {/* Left Side - File Manager & Audio Controls */}
            <div className="col-span-3 space-y-4">
              <Card className="bg-player-surface border-border p-4">
                <FileManager onFilesAdd={addFiles} />
              </Card>
              
                <Card className="bg-player-surface border-border">
                  <EnhancedAudioEffects />
                </Card>
                
                <Card className="bg-player-surface border-border p-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Audio Controls</h3>
                    <EqualizerPopup />
                  </div>
                </Card>
            </div>

            {/* Center Content */}
            <div className="col-span-6 space-y-4">
              {/* Now Playing with Visualizer */}
              <Card className="bg-player-surface border-border">
                <NowPlaying 
                  track={currentTrack} 
                  isPlaying={isPlaying} 
                  analyser={analyserRef.current}
                />
              </Card>

              {/* Track List */}
              <Card className="bg-player-surface border-border flex-1 relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-10 bg-center bg-no-repeat bg-contain"
                  style={{ backgroundImage: `url(${auraLogo})` }}
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
            <div className="col-span-3">
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

export const MusicPlayer: React.FC = () => {
  return (
    <ThemeProvider>
      <MusicPlayerContent />
    </ThemeProvider>
  );
};