import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

interface SharedAudioProcessorContextType {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyserNode: AnalyserNode | null;
  masterGainNode: GainNode | null;
  connectToChain: (inputNode: AudioNode, outputNode?: AudioNode) => void;
  disconnectFromChain: (node: AudioNode) => void;
}

const SharedAudioProcessorContext = createContext<SharedAudioProcessorContextType | null>(null);

export const useSharedAudioProcessor = () => {
  const context = useContext(SharedAudioProcessorContext);
  if (!context) {
    throw new Error('useSharedAudioProcessor must be used within a SharedAudioProcessorProvider');
  }
  return context;
};

interface SharedAudioProcessorProviderProps {
  children: React.ReactNode;
  audioElement: HTMLAudioElement | null;
}

export const SharedAudioProcessorProvider: React.FC<SharedAudioProcessorProviderProps> = ({
  children,
  audioElement,
}) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [masterGainNode, setMasterGainNode] = useState<GainNode | null>(null);
  
  const connectedNodes = useRef<Set<AudioNode>>(new Set());

  useEffect(() => {
    if (!audioElement) {
      cleanup();
      return;
    }

    try {
      // Create or reuse AudioContext
      const ctx = audioContext || new AudioContext();
      
      // Only create source if we don't have one
      if (!sourceNode) {
        const source = ctx.createMediaElementSource(audioElement);
        const analyser = ctx.createAnalyser();
        const masterGain = ctx.createGain();

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        masterGain.gain.value = 1.0;

        // Connect: source -> analyser -> masterGain -> destination
        source.connect(analyser);
        analyser.connect(masterGain);
        masterGain.connect(ctx.destination);

        setAudioContext(ctx);
        setSourceNode(source);
        setAnalyserNode(analyser);
        setMasterGainNode(masterGain);
      }
    } catch (error) {
      console.warn('Failed to initialize shared audio processor:', error);
    }

    return () => {
      // Don't cleanup on unmount, only when audioElement changes
    };
  }, [audioElement]);

  const cleanup = () => {
    connectedNodes.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Node already disconnected
      }
    });
    connectedNodes.current.clear();
    
    setSourceNode(null);
    setAnalyserNode(null);
    setMasterGainNode(null);
    setAudioContext(null);
  };

  const connectToChain = (inputNode: AudioNode, outputNode?: AudioNode) => {
    if (!masterGainNode || !analyserNode) return;
    
    try {
      // Check if connection already exists
      if (connectedNodes.current.has(inputNode)) {
        return;
      }
      
      // Safely disconnect existing connections
      try {
        analyserNode.disconnect(masterGainNode);
      } catch (e) {
        // Connection might not exist, continue
      }
      
      // Connect new chain: analyser -> inputNode -> (outputNode || masterGain)
      analyserNode.connect(inputNode);
      inputNode.connect(outputNode || masterGainNode);
      connectedNodes.current.add(inputNode);
      
    } catch (error) {
      console.warn('Failed to connect node to chain:', error);
      // Restore direct connection as fallback
      try {
        if (analyserNode && masterGainNode) {
          analyserNode.connect(masterGainNode);
        }
      } catch (fallbackError) {
        console.warn('Fallback connection failed:', fallbackError);
      }
    }
  };

  const disconnectFromChain = (node: AudioNode) => {
    try {
      node.disconnect();
      connectedNodes.current.delete(node);
      
      // Restore direct connection if no other nodes are connected
      if (connectedNodes.current.size === 0 && analyserNode && masterGainNode) {
        try {
          analyserNode.connect(masterGainNode);
        } catch (e) {
          // Connection might already exist
        }
      }
    } catch (error) {
      console.warn('Failed to disconnect node from chain:', error);
    }
  };

  const value = {
    audioContext,
    sourceNode,
    analyserNode,
    masterGainNode,
    connectToChain,
    disconnectFromChain,
  };

  return (
    <SharedAudioProcessorContext.Provider value={value}>
      {children}
    </SharedAudioProcessorContext.Provider>
  );
};