import React, { useState, useRef, useEffect } from 'react';
import { PlayerControls } from './player/PlayerControls';
import { TrackList } from './player/TrackList';
import { NowPlaying } from './player/NowPlaying';
import { Visualizer } from './player/Visualizer';
import { FileManager } from './player/FileManager';
import { PlaylistManager } from './player/PlaylistManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

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

export const MusicPlayer: React.FC = () => {
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
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    
    if (repeatMode === 'none' && currentIndex === tracks.length - 1) {
      setIsPlaying(false);
      return;
    }
    
    playTrack(tracks[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    
    playTrack(tracks[prevIndex]);
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

  return (
    <div className="min-h-screen bg-gradient-secondary p-4 space-y-4">
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
          Ultimate Music Player
        </h1>
        <p className="text-muted-foreground mt-2">
          Your complete audio experience
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-4 max-w-7xl mx-auto">
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
            <NowPlaying 
              track={currentTrack}
              isPlaying={isPlaying}
            />
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

        {/* Right Sidebar - Visualizer */}
        <div className="col-span-12 lg:col-span-3">
          <Card className="bg-player-surface border-border h-96">
            <Visualizer 
              analyser={analyserRef.current}
              isPlaying={isPlaying}
            />
          </Card>
        </div>
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