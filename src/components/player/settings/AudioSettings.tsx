import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedAudioEffects } from '../EnhancedAudioEffects';
import { EqualizerPopup } from '../EqualizerPopup';
import { GainMeter } from '../GainMeter';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Volume2 } from 'lucide-react';

interface AudioSettingsProps {
  audioElement?: HTMLAudioElement | null;
  audioContext?: AudioContext | null;
  analyser?: AnalyserNode | null;
  outputGain?: number;
  onOutputGainChange?: (gain: number) => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({ 
  audioElement, 
  audioContext, 
  analyser,
  outputGain = 0.6, 
  onOutputGainChange
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <Volume2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 bg-player-surface border-border">
        <Tabs defaultValue="effects" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="effects">Effects</TabsTrigger>
            <TabsTrigger value="equalizer">EQ</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
          
          <TabsContent value="effects" className="space-y-2">
            <h3 className="font-medium">Audio Effects</h3>
            <EnhancedAudioEffects 
              audioContext={audioContext}
              audioElement={audioElement}
              outputGain={outputGain}
            />
          </TabsContent>
          
          <TabsContent value="equalizer" className="space-y-2">
            <h3 className="font-medium">Equalizer</h3>
            <EqualizerPopup 
              audioContext={audioContext}
              audioElement={audioElement}
            />
          </TabsContent>
          
          <TabsContent value="output" className="space-y-2">
            <h3 className="font-medium">Output Gain</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
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
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};