import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Waves } from 'lucide-react';

interface AudioEffectsSettingsProps {
  fadeInDuration: number;
  fadeOutDuration: number;
  crossfadeDuration: number;
  gaplessPlayback: boolean;
  onFadeInChange: (value: number) => void;
  onFadeOutChange: (value: number) => void;
  onCrossfadeChange: (value: number) => void;
  onGaplessToggle: (value: boolean) => void;
}

export const AudioEffectsSettings: React.FC<AudioEffectsSettingsProps> = ({
  fadeInDuration,
  fadeOutDuration,
  crossfadeDuration,
  gaplessPlayback,
  onFadeInChange,
  onFadeOutChange,
  onCrossfadeChange,
  onGaplessToggle,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <Waves className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-popover text-popover-foreground border border-border" align="center">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Waves className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Audio Effects</h4>
          </div>
          
          <div className="space-y-4">
            {/* Gapless Playback */}
            <div className="flex items-center justify-between">
              <Label htmlFor="gapless" className="text-sm">
                Gapless Playback
              </Label>
              <Switch
                id="gapless"
                checked={gaplessPlayback}
                onCheckedChange={onGaplessToggle}
              />
            </div>

            {/* Fade In Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Fade In</Label>
                <span className="text-xs text-muted-foreground">
                  {(fadeInDuration / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[fadeInDuration]}
                onValueChange={([value]) => onFadeInChange(value)}
                max={5000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Fade Out Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Fade Out</Label>
                <span className="text-xs text-muted-foreground">
                  {(fadeOutDuration / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[fadeOutDuration]}
                onValueChange={([value]) => onFadeOutChange(value)}
                max={5000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Crossfade Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Crossfade</Label>
                <span className="text-xs text-muted-foreground">
                  {(crossfadeDuration / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[crossfadeDuration]}
                onValueChange={([value]) => onCrossfadeChange(value)}
                max={10000}
                min={0}
                step={500}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>• Gapless: Seamless track transitions</p>
            <p>• Fade In/Out: Smooth start/end</p>
            <p>• Crossfade: Blend between tracks</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};