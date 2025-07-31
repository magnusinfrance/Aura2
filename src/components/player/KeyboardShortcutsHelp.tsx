import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

export const KeyboardShortcutsHelp: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-player-elevated">
          <Keyboard className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 bg-popover border-border" align="center">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Keyboard className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Keyboard Shortcuts</h4>
          </div>
          
          <div className="space-y-2">
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Shortcuts work when not typing in text fields</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};