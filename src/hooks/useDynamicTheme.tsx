import { useEffect, useState } from 'react';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
}

export const useDynamicTheme = () => {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);

  const extractColorsFromImage = async (imageUrl: string): Promise<ColorPalette> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(getDefaultPalette());
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractDominantColors(imageData.data);
        
        resolve(createPaletteFromColors(colors));
      };

      img.onerror = () => {
        resolve(getDefaultPalette());
      };

      img.src = imageUrl;
    });
  };

  const extractDominantColors = (data: Uint8ClampedArray) => {
    const colorMap = new Map<string, number>();
    const sampleRate = 10; // Sample every 10th pixel for performance

    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      // Skip transparent pixels
      if (alpha < 125) continue;

      // Group similar colors
      const key = `${Math.floor(r / 10)}-${Math.floor(g / 10)}-${Math.floor(b / 10)}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Get top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key]) => {
        const [r, g, b] = key.split('-').map(v => parseInt(v) * 10);
        return { r, g, b };
      });

    return sortedColors;
  };

  const createPaletteFromColors = (colors: { r: number; g: number; b: number }[]): ColorPalette => {
    if (colors.length === 0) return getDefaultPalette();

    const dominant = colors[0];
    const secondary = colors[1] || dominant;
    
    return {
      primary: `${dominant.r} ${dominant.g} ${dominant.b}`,
      secondary: `${secondary.r} ${secondary.g} ${secondary.b}`,
      accent: `${Math.min(255, dominant.r + 30)} ${Math.min(255, dominant.g + 30)} ${Math.min(255, dominant.b + 30)}`,
      background: `${Math.max(0, dominant.r - 40)} ${Math.max(0, dominant.g - 40)} ${Math.max(0, dominant.b - 40)}`,
      surface: `${Math.max(0, dominant.r - 20)} ${Math.max(0, dominant.g - 20)} ${Math.max(0, dominant.b - 20)}`,
    };
  };

  const getDefaultPalette = (): ColorPalette => ({
    primary: '147 51 234',
    secondary: '99 102 241',
    accent: '168 85 247',
    background: '15 23 42',
    surface: '30 41 59',
  });

  const applyTheme = (palette: ColorPalette) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--secondary', palette.secondary);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--background', palette.background);
    root.style.setProperty('--card', palette.surface);
    root.style.setProperty('--popover', palette.surface);
  };

  const updateThemeFromAlbumArt = async (albumArtUrl: string | null) => {
    if (!albumArtUrl) {
      const defaultPalette = getDefaultPalette();
      setCurrentPalette(defaultPalette);
      applyTheme(defaultPalette);
      return;
    }

    try {
      const palette = await extractColorsFromImage(albumArtUrl);
      setCurrentPalette(palette);
      applyTheme(palette);
    } catch (error) {
      console.error('Failed to extract colors from album art:', error);
      const defaultPalette = getDefaultPalette();
      setCurrentPalette(defaultPalette);
      applyTheme(defaultPalette);
    }
  };

  const resetTheme = () => {
    const defaultPalette = getDefaultPalette();
    setCurrentPalette(defaultPalette);
    applyTheme(defaultPalette);
  };

  return {
    currentPalette,
    updateThemeFromAlbumArt,
    resetTheme,
  };
};