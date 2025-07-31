import React, { useEffect, useRef, useState } from 'react';
import { Activity, Zap, Circle, BarChart3, Waves, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface EnhancedVisualizerProps {
  analyser?: AnalyserNode | null;
  isPlaying: boolean;
}

type VisualizationType = 'bars' | 'wave' | 'circle' | 'particles' | 'spectrum';

export const EnhancedVisualizer: React.FC<EnhancedVisualizerProps> = ({ 
  analyser, 
  isPlaying 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('bars');

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'hsl(230, 25%, 8%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      switch (visualizationType) {
        case 'bars':
          drawBars(ctx, dataArray, canvas);
          break;
        case 'wave':
          drawWave(ctx, dataArray, canvas);
          break;
        case 'circle':
          drawCircle(ctx, dataArray, canvas);
          break;
        case 'particles':
          drawParticles(ctx, dataArray, canvas);
          break;
        case 'spectrum':
          drawSpectrum(ctx, dataArray, canvas);
          break;
      }

      if (isPlaying) {
        animationIdRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      draw();
    } else {
      drawStatic(ctx, canvas);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [analyser, isPlaying, visualizationType]);

  const createGradient = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim();
    const accentColor = computedStyle.getPropertyValue('--accent').trim();
    
    gradient.addColorStop(0, `hsl(${primaryColor})`);
    gradient.addColorStop(0.5, `hsl(${accentColor})`);
    gradient.addColorStop(1, 'hsl(300, 100%, 75%)');
    return gradient;
  };

  const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    const gradient = createGradient(ctx, canvas);

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 1.4;
      
      ctx.fillStyle = gradient;
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryColor = computedStyle.getPropertyValue('--primary').trim();
      ctx.shadowColor = `hsl(${primaryColor})`;
      ctx.shadowBlur = 20;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
    ctx.shadowBlur = 0;
  };

  const drawWave = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim();
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = `hsl(${primaryColor})`;
    ctx.shadowColor = `hsl(${primaryColor})`;
    ctx.shadowBlur = 25;
    
    ctx.beginPath();
    
    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] / 255) * canvas.height * 1.4;
      const y = canvas.height - v;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue('--primary').trim();
    const accentColor = computedStyle.getPropertyValue('--accent').trim();
    
    ctx.shadowColor = `hsl(${primaryColor})`;
    ctx.shadowBlur = 30;
    
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * radius * 1.12;
      const angle = (i / dataArray.length) * Math.PI * 2;
      
      const x1 = centerX + Math.cos(angle) * (radius - barHeight);
      const y1 = centerY + Math.sin(angle) * (radius - barHeight);
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, `hsl(${primaryColor})`);
      gradient.addColorStop(1, `hsl(${accentColor})`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    for (let i = 0; i < dataArray.length; i += 4) {
      const amplitude = dataArray[i] / 255;
      if (amplitude > 0.1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = amplitude * 8;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `hsla(${260 + i}, 100%, 65%, 1)`);
        gradient.addColorStop(1, `hsla(${260 + i}, 100%, 65%, 0.3)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawSpectrum = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    
    for (let x = 0; x < canvas.width; x++) {
      const freq = Math.floor((x / canvas.width) * dataArray.length);
      const amplitude = dataArray[freq] / 255;
      
      for (let y = 0; y < canvas.height; y++) {
        // Invert the calculation to render from bottom to top
        const bottomY = canvas.height - 1 - y;
        const intensity = Math.max(0, amplitude - (y / canvas.height));
        const pixelIndex = (bottomY * canvas.width + x) * 4;
        
        if (intensity > 0) {
          const hue = (freq / dataArray.length) * 360;
          const rgb = hslToRgb(hue, 100, 50 + intensity * 50);
          
          imageData.data[pixelIndex] = rgb[0];     // R
          imageData.data[pixelIndex + 1] = rgb[1]; // G
          imageData.data[pixelIndex + 2] = rgb[2]; // B
          imageData.data[pixelIndex + 3] = Math.min(255, intensity * 400); // A - increased intensity
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color);
    };
    
    return [f(0), f(8), f(4)];
  };

  const drawStatic = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = 'hsl(230, 25%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 32; i++) {
      const barHeight = Math.random() * 20 + 5;
      const x = (i * canvas.width) / 32;
      const barWidth = (canvas.width / 32) - 2;
      
      ctx.fillStyle = 'hsl(230, 15%, 20%)';
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    }
  };

  const visualizationOptions = [
    { value: 'bars', label: 'Bars', icon: BarChart3 },
    { value: 'wave', label: 'Wave', icon: Waves },
    { value: 'circle', label: 'Circle', icon: Target },
    { value: 'particles', label: 'Particles', icon: Circle },
    { value: 'spectrum', label: 'Spectrum', icon: Activity },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Visualizer</h3>
          </div>
          
          <Select value={visualizationType} onValueChange={(value) => setVisualizationType(value as VisualizationType)}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visualizationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 p-4">
        {analyser ? (
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="w-full h-full rounded-lg bg-player-bg"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center bg-player-bg rounded-lg">
            <Zap className="h-12 w-12 text-muted-foreground mb-3" />
            <h4 className="font-medium text-muted-foreground mb-1">
              Start Playing Music
            </h4>
            <p className="text-sm text-muted-foreground/70">
              Audio visualization will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};