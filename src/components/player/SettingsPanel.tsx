import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from './ThemeSelector';
import { LayoutSelector } from './LayoutSelector';
import { EnhancedAudioEffects } from './EnhancedAudioEffects';
import { EqualizerPopup } from './EqualizerPopup';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Settings, Info, FileType, Sliders, Volume2 } from 'lucide-react';

interface SettingsPanelProps {
  layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus';
  setLayout: (layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus') => void;
  trackListView: 'list' | 'grid' | 'album' | 'minimal';
  setTrackListView: (view: 'list' | 'grid' | 'album' | 'minimal') => void;
  audioElement?: HTMLAudioElement | null;
  audioContext?: AudioContext | null;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ layout, setLayout, trackListView, setTrackListView, audioElement, audioContext }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-player-surface border-border">
        <DropdownMenuLabel>Theme & Layout</DropdownMenuLabel>
        <div className="p-2">
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-1 block">Theme</label>
            <ThemeSelector />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Layout</label>
            <LayoutSelector layout={layout} setLayout={setLayout} />
          </div>
          <div className="mt-3">
            <label className="text-xs text-muted-foreground mb-1 block">Track List View</label>
            <select 
              value={trackListView} 
              onChange={(e) => setTrackListView(e.target.value as any)}
              className="w-full px-2 py-1 text-xs bg-player-elevated border border-border rounded"
            >
              <option value="list">Detailed List</option>
              <option value="grid">Grid View</option>
              <option value="album">Album View</option>
              <option value="minimal">Minimal Queue</option>
            </select>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Audio Effects
        </DropdownMenuLabel>
        <div className="p-2">
          <EnhancedAudioEffects 
            audioContext={audioContext}
            audioElement={audioElement}
          />
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sliders className="h-4 w-4" />
          Equalizer
        </DropdownMenuLabel>
        <div className="p-2">
          <EqualizerPopup 
            audioContext={audioContext}
            audioElement={audioElement}
          />
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileType className="h-4 w-4" />
          Supported Formats
        </DropdownMenuLabel>
        <div className="p-2 text-xs text-muted-foreground space-y-1">
          <div>• MP3, FLAC, WAV, OGG</div>
          <div>• M4A, AAC, WMA</div>
          <div>• 16-bit & 24-bit support</div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Information
        </DropdownMenuLabel>
        <div className="p-2 text-xs text-muted-foreground space-y-1">
          <div>Version: 2.0.0</div>
          <div>Built with React & Web Audio API</div>
          <div>High-quality audio visualization</div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};