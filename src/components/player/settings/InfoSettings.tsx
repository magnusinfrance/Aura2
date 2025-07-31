import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Info } from 'lucide-react';

export const InfoSettings: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 bg-player-surface border-border">
        <div className="space-y-2">
          <h3 className="font-medium">Information</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Version: 2.0.0</div>
            <div>Built with React & Web Audio API</div>
            <div>High-quality audio visualization</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};