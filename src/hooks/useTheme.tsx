import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'neon' | 'sunset' | 'ocean' | 'forest' | 'cyberpunk' | 'retro' | 'arctic' | 'fire' | 'gold';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { name: Theme; label: string; colors: Record<string, string> }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = [
  {
    name: 'dark' as Theme,
    label: 'Dark Purple',
    colors: {
      '--primary': '260 100% 65%',
      '--accent': '280 100% 70%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(260 100% 65%), hsl(280 100% 70%))',
    }
  },
  {
    name: 'neon' as Theme,
    label: 'Neon Green',
    colors: {
      '--primary': '120 100% 50%',
      '--accent': '140 100% 60%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(120 100% 50%), hsl(140 100% 60%))',
    }
  },
  {
    name: 'sunset' as Theme,
    label: 'Sunset Orange',
    colors: {
      '--primary': '20 100% 60%',
      '--accent': '45 100% 70%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(20 100% 60%), hsl(45 100% 70%))',
    }
  },
  {
    name: 'ocean' as Theme,
    label: 'Ocean Blue',
    colors: {
      '--primary': '200 100% 50%',
      '--accent': '220 100% 60%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(200 100% 50%), hsl(220 100% 60%))',
    }
  },
  {
    name: 'forest' as Theme,
    label: 'Forest Green',
    colors: {
      '--primary': '150 50% 45%',
      '--accent': '170 60% 55%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(150 50% 45%), hsl(170 60% 55%))',
    }
  },
  {
    name: 'cyberpunk' as Theme,
    label: 'Cyberpunk Pink',
    colors: {
      '--primary': '320 100% 60%',
      '--accent': '300 100% 70%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(320 100% 60%), hsl(300 100% 70%))',
    }
  },
  {
    name: 'retro' as Theme,
    label: 'Retro Wave',
    colors: {
      '--primary': '290 100% 55%',
      '--accent': '315 100% 65%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(290 100% 55%), hsl(315 100% 65%))',
    }
  },
  {
    name: 'arctic' as Theme,
    label: 'Arctic Ice',
    colors: {
      '--primary': '180 100% 70%',
      '--accent': '200 100% 80%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(180 100% 70%), hsl(200 100% 80%))',
    }
  },
  {
    name: 'fire' as Theme,
    label: 'Fire Red',
    colors: {
      '--primary': '0 100% 55%',
      '--accent': '15 100% 65%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(0 100% 55%), hsl(15 100% 65%))',
    }
  },
  {
    name: 'gold' as Theme,
    label: 'Golden Hour',
    colors: {
      '--primary': '50 100% 55%',
      '--accent': '35 100% 65%',
      '--gradient-primary': 'linear-gradient(135deg, hsl(50 100% 55%), hsl(35 100% 65%))',
    }
  }
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('music-player-theme');
    return (stored as Theme) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = themes.find(t => t.name === theme);
    
    if (selectedTheme) {
      Object.entries(selectedTheme.colors).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
    }
    
    localStorage.setItem('music-player-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}