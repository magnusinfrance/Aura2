import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ThemeSelector } from './ThemeSelector';
import { LayoutSelector } from './LayoutSelector';
import { EnhancedAudioEffects } from './EnhancedAudioEffects';
import { EqualizerPopup } from './EqualizerPopup';
import { GainMeter } from './GainMeter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Settings, Info, FileType, Sliders, Volume2, Trash2 } from 'lucide-react';

interface SettingsPanelProps {
  layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus';
  setLayout: (layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus') => void;
  audioElement?: HTMLAudioElement | null;
  audioContext?: AudioContext | null;
  analyser?: AnalyserNode | null;
  outputGain?: number;
  onOutputGainChange?: (gain: number) => void;
  onFilesAdd?: (files: any[]) => void;
  onClearLibrary?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  layout, 
  setLayout, 
  audioElement, 
  audioContext, 
  analyser,
  outputGain = 0.6, 
  onOutputGainChange,
  onFilesAdd,
  onClearLibrary
}) => {
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
            outputGain={outputGain}
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
          <Trash2 className="h-4 w-4" />
          Music Library
        </DropdownMenuLabel>
        <div className="p-2">
          {onClearLibrary && (
            <Button
              onClick={onClearLibrary}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Library
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Output Gain
        </DropdownMenuLabel>
        <div className="p-2">
          <div className="flex items-center space-x-2 mb-3">
            <Slider
              value={[outputGain]}
              onValueChange={(value) => onOutputGainChange?.(value[0])}
              min={0.1}
              max={1.0}
              step={0.05}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground min-w-[3ch]">
              {Math.round(outputGain * 100)}%
            </span>
          </div>
          <GainMeter analyser={analyser} />
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