import { useRef, useCallback, useEffect } from 'react';

interface AudioEffectsConfig {
  fadeInDuration: number;
  fadeOutDuration: number;
  crossfadeDuration: number;
  gaplessPlayback: boolean;
}

export const useAudioEffects = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const crossfadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = useRef<AudioEffectsConfig>({
    fadeInDuration: 2000,
    fadeOutDuration: 2000,
    crossfadeDuration: 3000,
    gaplessPlayback: true,
  });

  const clearFadeInterval = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const clearCrossfadeInterval = () => {
    if (crossfadeIntervalRef.current) {
      clearInterval(crossfadeIntervalRef.current);
      crossfadeIntervalRef.current = null;
    }
  };

  const fadeIn = useCallback((audio: HTMLAudioElement, duration: number = config.current.fadeInDuration) => {
    clearFadeInterval();
    
    audio.volume = 0;
    const targetVolume = 1;
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);
      
      if (currentStep >= steps) {
        clearFadeInterval();
      }
    }, stepDuration);
  }, []);

  const fadeOut = useCallback((audio: HTMLAudioElement, duration: number = config.current.fadeOutDuration) => {
    return new Promise<void>((resolve) => {
      clearFadeInterval();
      
      const startVolume = audio.volume;
      const steps = 50;
      const stepDuration = duration / steps;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(startVolume - (volumeStep * currentStep), 0);
        
        if (currentStep >= steps) {
          clearFadeInterval();
          resolve();
        }
      }, stepDuration);
    });
  }, []);

  const crossfade = useCallback((
    currentAudio: HTMLAudioElement, 
    nextAudio: HTMLAudioElement, 
    duration: number = config.current.crossfadeDuration
  ) => {
    return new Promise<void>((resolve) => {
      clearCrossfadeInterval();
      
      const steps = 100;
      const stepDuration = duration / steps;
      let currentStep = 0;

      // Start next audio at volume 0
      nextAudio.volume = 0;
      nextAudio.play();

      crossfadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        // Fade out current audio
        currentAudio.volume = Math.max(1 - progress, 0);
        
        // Fade in next audio
        nextAudio.volume = Math.min(progress, 1);
        
        if (currentStep >= steps) {
          clearCrossfadeInterval();
          currentAudio.pause();
          resolve();
        }
      }, stepDuration);
    });
  }, []);

  const prepareGaplessPlayback = useCallback((nextTrackUrl: string) => {
    if (!config.current.gaplessPlayback) return;

    // Create and prepare next audio element
    if (nextAudioRef.current) {
      nextAudioRef.current.pause();
      nextAudioRef.current = null;
    }

    const nextAudio = new Audio(nextTrackUrl);
    nextAudio.preload = 'auto';
    nextAudio.volume = 0;
    nextAudioRef.current = nextAudio;

    // Preload the audio
    nextAudio.load();
  }, []);

  const playWithFadeIn = useCallback(async (audio: HTMLAudioElement) => {
    await audio.play();
    fadeIn(audio);
  }, [fadeIn]);

  const stopWithFadeOut = useCallback(async (audio: HTMLAudioElement) => {
    await fadeOut(audio);
    audio.pause();
  }, [fadeOut]);

  const switchToNextTrack = useCallback(async () => {
    if (!audioRef.current || !nextAudioRef.current) return;

    if (config.current.crossfadeDuration > 0) {
      await crossfade(audioRef.current, nextAudioRef.current);
    } else {
      audioRef.current.pause();
      nextAudioRef.current.volume = 1;
      await nextAudioRef.current.play();
    }

    // Swap references
    audioRef.current = nextAudioRef.current;
    nextAudioRef.current = null;
  }, [crossfade]);

  const updateConfig = useCallback((newConfig: Partial<AudioEffectsConfig>) => {
    config.current = { ...config.current, ...newConfig };
  }, []);

  const setAudioRef = useCallback((audio: HTMLAudioElement | null) => {
    audioRef.current = audio;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFadeInterval();
      clearCrossfadeInterval();
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
        nextAudioRef.current = null;
      }
    };
  }, []);

  return {
    fadeIn,
    fadeOut,
    crossfade,
    prepareGaplessPlayback,
    playWithFadeIn,
    stopWithFadeOut,
    switchToNextTrack,
    updateConfig,
    setAudioRef,
    config: config.current,
  };
};