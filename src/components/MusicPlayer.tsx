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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/hooks/useTheme';
import { Settings, Maximize2, Minimize2 } from 'lucide-react';

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
  const [layout, setLayout] = useState<'standard' | 'compact' | 'mini'>('standard');

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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

  const initializeAudioContext = () => {
    if (!audioContextRef.current && audioRef.current) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    }
  };

  const playTrack = (track: Track) => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      setCurrentTrack(track);
      setIsPlaying(true);
      audioRef.current.play();
      initializeAudioContext();
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        initializeAudioContext();
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

  const addFiles = (files: File[]) => {
    const newTracks: Track[] = files.map(file => ({
      id: Math.random().toString(36),
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file),
      file,
    }));
    
    setTracks(prev => [...prev, ...newTracks]);
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
    <div className="min-h-screen bg-gradient-secondary p-4 space-y-4">
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            Ultimate Music Player
          </h1>
          <p className="text-muted-foreground mt-2">
            Your complete audio experience
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <ThemeSelector />
          <LayoutSelector layout={layout} setLayout={setLayout} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLayout('mini')}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={`max-w-7xl mx-auto ${
        layout === 'compact' ? 'space-y-4' : 'grid grid-cols-12 gap-4'
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
                  analyser={analyserRef.current}
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
        ) : (
          // Standard Layout
          <>
            {/* Left Sidebar - File Manager & Playlists */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <Card className="bg-player-surface border-border p-4">
                <FileManager onFilesAdd={addFiles} />
              </Card>
              
              <Card className="bg-player-surface border-border p-4">
                <PlaylistManager 
                  playlists={playlists}
                  setPlaylists={setPlaylists}
                  tracks={tracks}
                  activePlaylist={activePlaylist}
                  setActivePlaylist={setActivePlaylist}
                />
              </Card>
            </div>

            {/* Center - Main Content */}
            <div className="col-span-12 lg:col-span-6 space-y-4">
              {/* Now Playing */}
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
                      
                      <div className="flex items-center mt-4">
                        <div className={`
                          w-3 h-3 rounded-full mr-3
                          ${isPlaying ? 'bg-player-success animate-pulse' : 'bg-muted-foreground'}
                        `} />
                        <span className="text-sm font-medium text-muted-foreground">
                          {isPlaying ? 'Now Playing' : 'Paused'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Elements */}
                    <div className="hidden lg:flex items-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`
                            w-1 bg-gradient-accent rounded-full transition-all duration-300
                            ${isPlaying ? 'animate-pulse' : 'opacity-30'}
                          `}
                          style={{
                            height: isPlaying ? `${20 + Math.random() * 30}px` : '15px',
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Track List */}
              <Card className="bg-player-surface border-border">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
                  <TabsList className="grid grid-cols-3 w-full bg-player-elevated">
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="grid">Grid</TabsTrigger>
                    <TabsTrigger value="album">Album</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="list" className="mt-0">
                    <TrackList 
                      tracks={tracks}
                      currentTrack={currentTrack}
                      onTrackSelect={playTrack}
                      viewMode="list"
                    />
                  </TabsContent>
                  
                  <TabsContent value="grid" className="mt-0">
                    <TrackList 
                      tracks={tracks}
                      currentTrack={currentTrack}
                      onTrackSelect={playTrack}
                      viewMode="grid"
                    />
                  </TabsContent>
                  
                  <TabsContent value="album" className="mt-0">
                    <TrackList 
                      tracks={tracks}
                      currentTrack={currentTrack}
                      onTrackSelect={playTrack}
                      viewMode="album"
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Sidebar - Queue & Visualizer */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <Card className="bg-player-surface border-border h-96">
                <EnhancedVisualizer 
                  analyser={analyserRef.current}
                  isPlaying={isPlaying}
                />
              </Card>
              
              <Card className="bg-player-surface border-border h-96">
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
                />
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Bottom Player Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-player-surface/95 backdrop-blur-lg border-t border-border">
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