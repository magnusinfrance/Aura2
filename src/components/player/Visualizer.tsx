import React, { useEffect, useRef } from 'react';
import { Activity, Zap } from 'lucide-react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();

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

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, 'hsl(260, 100%, 65%)');
      gradient.addColorStop(0.5, 'hsl(280, 100%, 70%)');
      gradient.addColorStop(1, 'hsl(300, 100%, 75%)');

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        // Add glow effect
        ctx.shadowColor = 'hsl(260, 100%, 65%)';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;

        x += barWidth + 1;
      }

      if (isPlaying) {
        animationIdRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
      draw();
    } else {
      // Draw static bars when not playing
      ctx.fillStyle = 'hsl(230, 25%, 8%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < 32; i++) {
        const barHeight = Math.random() * 20 + 5;
        const x = (i * canvas.width) / 32;
        const barWidth = (canvas.width / 32) - 2;
        
        ctx.fillStyle = 'hsl(230, 15%, 20%)';
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      }
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Audio Visualizer</h3>
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

      {/* Preset Visualizer Styles */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Style</span>
          <div className="flex space-x-1">
            {['bars', 'wave', 'circle'].map((style, index) => (
              <div
                key={style}
                className={`w-2 h-6 rounded-sm ${
                  index === 0 ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};