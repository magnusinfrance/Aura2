import React from 'react';
import { Button } from '@/components/ui/button';
import { ThemeSelector } from '../ThemeSelector';
import { LayoutSelector } from '../LayoutSelector';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ThemeLayoutSettingsProps {
  layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus';
  setLayout: (layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus') => void;
}

export const ThemeLayoutSettings: React.FC<ThemeLayoutSettingsProps> = ({ 
  layout, 
  setLayout 
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-player-surface border-border">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Theme</h3>
            <ThemeSelector />
          </div>
          <div>
            <h3 className="font-medium mb-2">Layout</h3>
            <LayoutSelector layout={layout} setLayout={setLayout} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};