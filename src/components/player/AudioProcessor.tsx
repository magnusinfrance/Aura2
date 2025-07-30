import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

interface AudioProcessorContextType {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyserNode: AnalyserNode | null;
  masterGainNode: GainNode | null;
  connectToChain: (inputNode: AudioNode, outputNode?: AudioNode) => void;
  disconnectFromChain: (node: AudioNode) => void;
}

const AudioProcessorContext = createContext<AudioProcessorContextType | null>(null);

export const useAudioProcessor = () => {
  const context = useContext(AudioProcessorContext);
  if (!context) {
    throw new Error('useAudioProcessor must be used within AudioProcessorProvider');
  }
  return context;
};

interface AudioProcessorProviderProps {
  children: React.ReactNode;
  audioElement: HTMLAudioElement | null;
}

export const AudioProcessorProvider: React.FC<AudioProcessorProviderProps> = ({ 
  children, 
  audioElement 
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAudioGraph = () => {
    if (!audioElement || audioContextRef.current) return;

    try {
      const audioContext = new AudioContext();
      const sourceNode = audioContext.createMediaElementSource(audioElement);
      const analyserNode = audioContext.createAnalyser();
      const masterGainNode = audioContext.createGain();

      // Configure analyser
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;

      // Set up basic chain: source -> analyser -> masterGain -> destination
      sourceNode.connect(analyserNode);
      analyserNode.connect(masterGainNode);
      masterGainNode.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      sourceNodeRef.current = sourceNode;
      analyserNodeRef.current = analyserNode;
      masterGainNodeRef.current = masterGainNode;

      setIsInitialized(true);
      console.log('Audio processor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
    }
  };

  useEffect(() => {
    if (audioElement && !isInitialized) {
      initializeAudioGraph();
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioElement, isInitialized]);

  const connectToChain = (inputNode: AudioNode, outputNode?: AudioNode) => {
    if (!masterGainNodeRef.current) return;
    
    try {
      // If no output node specified, connect to master gain
      const target = outputNode || masterGainNodeRef.current;
      inputNode.connect(target);
    } catch (error) {
      console.warn('Failed to connect audio node to chain:', error);
    }
  };

  const disconnectFromChain = (node: AudioNode) => {
    try {
      node.disconnect();
    } catch (error) {
      console.warn('Failed to disconnect audio node:', error);
    }
  };

  const value: AudioProcessorContextType = {
    audioContext: audioContextRef.current,
    sourceNode: sourceNodeRef.current,
    analyserNode: analyserNodeRef.current,
    masterGainNode: masterGainNodeRef.current,
    connectToChain,
    disconnectFromChain,
  };

  return (
    <AudioProcessorContext.Provider value={value}>
      {children}
    </AudioProcessorContext.Provider>
  );
};