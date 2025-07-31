import React from 'react';
import { ThemeLayoutSettings } from './settings/ThemeLayoutSettings';
import { AudioSettings } from './settings/AudioSettings';
import { LibrarySettings } from './settings/LibrarySettings';
import { InfoSettings } from './settings/InfoSettings';
import { AudioEffectsSettings } from './settings/AudioEffectsSettings';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';


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
  fadeInDuration?: number;
  fadeOutDuration?: number;
  crossfadeDuration?: number;
  gaplessPlayback?: boolean;
  onFadeInChange?: (value: number) => void;
  onFadeOutChange?: (value: number) => void;
  onCrossfadeChange?: (value: number) => void;
  onGaplessToggle?: (value: boolean) => void;
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
  fadeInDuration = 2000,
  fadeOutDuration = 2000,
  crossfadeDuration = 3000,
  gaplessPlayback = true,
  onFadeInChange,
  onFadeOutChange,
  onCrossfadeChange,
  onGaplessToggle,
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
      <LibrarySettings
        onFilesAdd={onFilesAdd}
        onClearLibrary={onClearLibrary}
      />
      <AudioEffectsSettings
        fadeInDuration={fadeInDuration}
        fadeOutDuration={fadeOutDuration}
        crossfadeDuration={crossfadeDuration}
        gaplessPlayback={gaplessPlayback}
        onFadeInChange={onFadeInChange || (() => {})}
        onFadeOutChange={onFadeOutChange || (() => {})}
        onCrossfadeChange={onCrossfadeChange || (() => {})}
        onGaplessToggle={onGaplessToggle || (() => {})}
      />
      <KeyboardShortcutsHelp />
      <InfoSettings />
    </div>
  );
};