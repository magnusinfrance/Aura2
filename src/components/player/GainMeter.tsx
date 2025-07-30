import React, { useEffect, useRef, useState } from 'react';

interface GainMeterProps {
  audioElement?: HTMLAudioElement | null;
  audioContext?: AudioContext | null;
}

export const GainMeter: React.FC<GainMeterProps> = ({ audioElement, audioContext }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!audioElement || !audioContext || !canvasRef.current) return;

    try {
      // Create analyser for gain metering
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;

      // Connect audio source to analyser
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsInitialized(true);

      return () => {
        source.disconnect();
        analyser.disconnect();
      };
    } catch (error) {
      console.warn('Error setting up gain meter:', error);
    }
  }, [audioElement, audioContext]);

  useEffect(() => {
    if (!isInitialized || !canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate RMS values for left and right channels (simplified)
      const dataArray = dataArrayRef.current;
      const leftChannelData = dataArray.slice(0, dataArray.length / 2);
      const rightChannelData = dataArray.slice(dataArray.length / 2);
      
      const leftRMS = Math.sqrt(leftChannelData.reduce((sum, val) => sum + val * val, 0) / leftChannelData.length) / 255;
      const rightRMS = Math.sqrt(rightChannelData.reduce((sum, val) => sum + val * val, 0) / rightChannelData.length) / 255;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = 'hsl(var(--player-surface))';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw meter bars
      const barWidth = 12;
      const barSpacing = 4;
      const maxHeight = canvas.height - 10;
      
      // Left channel
      const leftHeight = leftRMS * maxHeight;
      const leftGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      if (leftRMS > 0.8) {
        leftGradient.addColorStop(0, '#22c55e'); // Green
        leftGradient.addColorStop(0.7, '#eab308'); // Yellow
        leftGradient.addColorStop(1, '#ef4444'); // Red
      } else if (leftRMS > 0.6) {
        leftGradient.addColorStop(0, '#22c55e'); // Green
        leftGradient.addColorStop(1, '#eab308'); // Yellow
      } else {
        leftGradient.addColorStop(0, '#22c55e'); // Green
        leftGradient.addColorStop(1, '#22c55e'); // Green
      }
      
      ctx.fillStyle = leftGradient;
      ctx.fillRect(5, canvas.height - leftHeight - 5, barWidth, leftHeight);

      // Right channel
      const rightHeight = rightRMS * maxHeight;
      const rightGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      if (rightRMS > 0.8) {
        rightGradient.addColorStop(0, '#22c55e'); // Green
        rightGradient.addColorStop(0.7, '#eab308'); // Yellow
        rightGradient.addColorStop(1, '#ef4444'); // Red
      } else if (rightRMS > 0.6) {
        rightGradient.addColorStop(0, '#22c55e'); // Green
        rightGradient.addColorStop(1, '#eab308'); // Yellow
      } else {
        rightGradient.addColorStop(0, '#22c55e'); // Green
        rightGradient.addColorStop(1, '#22c55e'); // Green
      }
      
      ctx.fillStyle = rightGradient;
      ctx.fillRect(5 + barWidth + barSpacing, canvas.height - rightHeight - 5, barWidth, rightHeight);

      // Draw scale marks
      ctx.strokeStyle = 'hsl(var(--muted-foreground))';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const y = (canvas.height - 10) * (1 - i / 10) + 5;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 8, y);
        ctx.lineTo(canvas.width - 3, y);
        ctx.stroke();
      }

      // Labels
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('L', 5 + barWidth / 2, canvas.height - 1);
      ctx.fillText('R', 5 + barWidth + barSpacing + barWidth / 2, canvas.height - 1);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized]);

  return (
    <div className="w-full h-20 bg-player-elevated rounded border border-border">
      <div className="p-2">
        <div className="text-xs font-medium text-muted-foreground mb-1">Output Level</div>
        <canvas
          ref={canvasRef}
          width={60}
          height={50}
          className="w-full h-12"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
};