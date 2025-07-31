import React from 'react';
import { ThemeLayoutSettings } from './settings/ThemeLayoutSettings';
import { AudioSettings } from './settings/AudioSettings';
import { LibrarySettings } from './settings/LibrarySettings';
import { InfoSettings } from './settings/InfoSettings';
import { LyricsSettings } from './settings/LyricsSettings';

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
  onShowLyrics?: () => void;
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
  onClearLibrary,
  onShowLyrics
}) => {
  return (
    <div className="flex items-center gap-1">
      <ThemeLayoutSettings 
        layout={layout} 
        setLayout={setLayout} 
      />
      <AudioSettings
        audioElement={audioElement}
        audioContext={audioContext}
        analyser={analyser}
        outputGain={outputGain}
        onOutputGainChange={onOutputGainChange}
      />
      <LyricsSettings 
        onShowLyrics={onShowLyrics || (() => {})}
      />
      <LibrarySettings
        onFilesAdd={onFilesAdd}
        onClearLibrary={onClearLibrary}
      />
      <InfoSettings />
    </div>
  );
};