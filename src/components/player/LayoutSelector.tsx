import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Layout, LayoutGrid, Sidebar, Check } from 'lucide-react';

interface LayoutSelectorProps {
  layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus';
  setLayout: (layout: 'standard' | 'compact' | 'mini' | 'widescreen' | 'focus') => void;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({ layout, setLayout }) => {
  const layouts = [
    {
      id: 'standard' as const,
      name: 'Standard',
      description: 'Full-featured layout with all panels',
      icon: LayoutGrid,
    },
    {
      id: 'compact' as const,
      name: 'Compact',
      description: 'Condensed layout for smaller screens',
      icon: Layout,
    },
    {
      id: 'widescreen' as const,
      name: 'Widescreen',
      description: 'Optimized for wide displays',
      icon: LayoutGrid,
    },
    {
      id: 'focus' as const,
      name: 'Focus Mode',
      description: 'Distraction-free listening experience',
      icon: Layout,
    },
    {
      id: 'mini' as const,
      name: 'Mini Player',
      description: 'Minimal player for background listening',
      icon: Sidebar,
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Layout className="h-4 w-4 mr-2" />
          Layout
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Choose Layout</h3>
          
          <div className="space-y-2">
            {layouts.map((layoutOption) => (
              <button
                key={layoutOption.id}
                onClick={() => setLayout(layoutOption.id)}
                className={`
                  flex items-start justify-between p-3 rounded-lg border transition-all w-full text-left
                  ${layout === layoutOption.id 
                    ? 'bg-primary/10 border-primary/20' 
                    : 'bg-card border-border hover:bg-accent/10'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <layoutOption.icon className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-medium text-sm">{layoutOption.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {layoutOption.description}
                    </p>
                  </div>
                </div>
                
                {layout === layoutOption.id && (
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                )}
              </button>
            ))}
          </div>
          
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Layout changes how the music player interface is organized
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};