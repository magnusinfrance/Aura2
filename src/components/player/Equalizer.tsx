import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';

interface EqualizerProps {
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
}

const EQ_FREQUENCIES = [60, 170, 350, 1000, 3500, 10000];

const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0],
  rock: [5, 3, -1, 1, 3, 5],
  pop: [2, 4, 2, 0, -1, 2],
  jazz: [4, 2, 0, 2, 4, 5],
  classical: [5, 3, -1, -1, 0, 4],
  electronic: [5, 3, 1, 0, 3, 5],
  'hip-hop': [6, 4, 1, 3, -1, 2],
  vocal: [2, -3, 2, 4, 5, 3],
  bass: [8, 6, 3, 1, -2, -3],
  treble: [-3, -2, 1, 3, 5, 8],
};

export const Equalizer: React.FC<EqualizerProps> = ({ audioContext, audioElement }) => {
  const [gains, setGains] = useState<number[]>(Array(6).fill(0));
  const [selectedPreset, setSelectedPreset] = useState<string>('flat');
  const [isEnabled, setIsEnabled] = useState(false);
  
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (audioContext && audioElement && !sourceRef.current) {
      setupEqualizer();
    }
  }, [audioContext, audioElement]);

  const setupEqualizer = () => {
    if (!audioContext || !audioElement) return;

    try {
      // Create source if it doesn't exist
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
      }

      // Create gain node
      gainNodeRef.current = audioContext.createGain();

      // Create filters
      filtersRef.current = EQ_FREQUENCIES.map((freq, index) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = index === 0 ? 'lowshelf' : index === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      connectEqualizer();
    } catch (error) {
      console.warn('Equalizer setup failed:', error);
    }
  };

  const connectEqualizer = () => {
    if (!sourceRef.current || !gainNodeRef.current || filtersRef.current.length === 0) return;

    // Disconnect everything first
    sourceRef.current.disconnect();
    filtersRef.current.forEach(filter => filter.disconnect());
    gainNodeRef.current.disconnect();

    if (isEnabled) {
      // Connect through equalizer chain
      let currentNode = sourceRef.current;
      
      filtersRef.current.forEach(filter => {
        currentNode.connect(filter);
        currentNode = filter as any;
      });
      
      currentNode.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContext!.destination);
    } else {
      // Bypass equalizer
      sourceRef.current.connect(audioContext!.destination);
    }
  };

  const updateGain = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    
    if (filtersRef.current[index] && isEnabled) {
      filtersRef.current[index].gain.value = value;
    }
    
    setSelectedPreset('custom');
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'custom') return;
    
    const presetGains = EQ_PRESETS[presetName as keyof typeof EQ_PRESETS];
    if (presetGains) {
      setGains(presetGains);
      setSelectedPreset(presetName);
      
      if (isEnabled) {
        presetGains.forEach((gain, index) => {
          if (filtersRef.current[index]) {
            filtersRef.current[index].gain.value = gain;
          }
        });
      }
    }
  };

  const resetEqualizer = () => {
    const flatGains = Array(6).fill(0);
    setGains(flatGains);
    setSelectedPreset('flat');
    
    if (isEnabled) {
      flatGains.forEach((gain, index) => {
        if (filtersRef.current[index]) {
          filtersRef.current[index].gain.value = gain;
        }
      });
    }
  };

  const toggleEqualizer = () => {
    setIsEnabled(!isEnabled);
  };

  useEffect(() => {
    connectEqualizer();
  }, [isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      gains.forEach((gain, index) => {
        if (filtersRef.current[index]) {
          filtersRef.current[index].gain.value = gain;
        }
      });
    }
  }, [isEnabled, gains]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Equalizer</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleEqualizer}
            className="text-xs"
          >
            {isEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button variant="ghost" size="sm" onClick={resetEqualizer}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isEnabled && (
        <>
          <div className="mb-4">
            <Label className="text-xs mb-2 block">Preset</Label>
            <Select value={selectedPreset} onValueChange={applyPreset}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(EQ_PRESETS).map(preset => (
                  <SelectItem key={preset} value={preset}>
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {EQ_FREQUENCIES.map((freq, index) => (
              <div key={freq} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">
                    {freq < 1000 ? `${freq}Hz` : `${freq / 1000}kHz`}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {gains[index] > 0 ? '+' : ''}{gains[index]}dB
                  </span>
                </div>
                <Slider
                  value={[gains[index]]}
                  onValueChange={(value) => updateGain(index, value[0])}
                  min={-12}
                  max={12}
                  step={0.5}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};