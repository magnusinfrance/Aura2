import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, themes } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Palette className="h-4 w-4 mr-2" />
          Theme
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Choose Theme</h3>
          
          <div className="grid grid-cols-1 gap-2">
            {themes.map((themeOption) => (
              <button
                key={themeOption.name}
                onClick={() => setTheme(themeOption.name)}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all
                  ${theme === themeOption.name 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-card border-border hover:bg-accent/10'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white/20"
                    style={{ 
                      background: themeOption.colors['--gradient-primary'] || themeOption.colors['--primary']
                    }}
                  />
                  <span className="font-medium text-sm">{themeOption.label}</span>
                </div>
                
                {theme === themeOption.name && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Themes change the color scheme and visual effects throughout the app
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};