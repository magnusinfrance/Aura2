import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedEqualizer } from './EnhancedEqualizer';
import { Sliders } from 'lucide-react';

interface EqualizerPopupProps {
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
}

export const EqualizerPopup: React.FC<EqualizerPopupProps> = ({ audioContext, audioElement }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sliders className="h-4 w-4" />
          Equalizer
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[100]" 
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="max-w-lg">
          <EnhancedEqualizer 
            audioContext={audioContext}
            audioElement={audioElement}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};