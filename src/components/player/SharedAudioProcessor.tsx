import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

interface SharedAudioProcessorContextType {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyserNode: AnalyserNode | null;
  masterGainNode: GainNode | null;
  connectToChain: (inputNode: AudioNode, outputNode?: AudioNode, processorId?: string) => void;
  disconnectFromChain: (processorId: string) => void;
  resetAudioBus: () => void;
  initializeOnUserAction: () => Promise<void>;
  getAnalyserData: () => { analyser: AnalyserNode | null; isConnected: boolean };
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
  
  const connectedProcessors = useRef<Map<string, { input: AudioNode; output: AudioNode }>>(new Map());
  const connectedNodes = useRef<Set<AudioNode>>(new Set());

  useEffect(() => {
    if (!audioElement) {
      cleanup();
      return;
    }

    // Prevent multiple source nodes from the same audio element
    if (sourceNode && audioContext && audioContext.state !== 'closed') {
      console.log('Audio processor already initialized, skipping...');
      return;
    }

    const initializeAudioProcessor = async () => {
      try {
        console.log('Initializing audio processor...');
        
        // Create AudioContext with user interaction
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('AudioContext created, state:', ctx.state);
        
        // Resume context if suspended (required for Safari/iOS)
        if (ctx.state === 'suspended') {
          console.log('Resuming suspended audio context...');
          await ctx.resume();
          console.log('Audio context resumed, new state:', ctx.state);
        }
        
        // Check if audio element already has a source node
        if ((audioElement as any).__hasSourceNode) {
          console.warn('Audio element already has a source node, skipping initialization');
          return;
        }
        
        console.log('Creating audio nodes...');
        const source = ctx.createMediaElementSource(audioElement);
        const analyser = ctx.createAnalyser();
        const masterGain = ctx.createGain();

        // Mark audio element to prevent duplicate source nodes
        (audioElement as any).__hasSourceNode = true;

        // Configure with safer values for production
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        masterGain.gain.value = 0.3;

        console.log('Connecting audio nodes...');
        // Connect: source -> analyser -> masterGain -> destination
        source.connect(analyser);
        analyser.connect(masterGain);
        masterGain.connect(ctx.destination);

        setAudioContext(ctx);
        setSourceNode(source);
        setAnalyserNode(analyser);
        setMasterGainNode(masterGain);

        console.log('Audio processor initialized successfully with analyser:', !!analyser);
      } catch (error) {
        console.error('Failed to initialize shared audio processor:', error);
        cleanup();
      }
    };

    initializeAudioProcessor();

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
    
    // Clear the audio element marker
    if (audioElement) {
      delete (audioElement as any).__hasSourceNode;
    }
    
    setSourceNode(null);
    setAnalyserNode(null);
    setMasterGainNode(null);
    setAudioContext(null);
  };

  const connectToChain = (inputNode: AudioNode, outputNode?: AudioNode, processorId?: string) => {
    if (!masterGainNode || !analyserNode) {
      console.warn('Missing required nodes for audio chain connection');
      return;
    }
    
    const id = processorId || 'default';
    
    try {
      // Check if processor already exists
      if (connectedProcessors.current.has(id)) {
        console.log(`Processor ${id} already connected, disconnecting first`);
        disconnectFromChain(id);
      }
      
      console.log(`Connecting processor ${id} to audio chain...`);
      
      // Store processor info
      connectedProcessors.current.set(id, {
        input: inputNode,
        output: outputNode || inputNode
      });
      
      // Rebuild the entire chain
      rebuildAudioChain();
      
      console.log(`Processor ${id} connected successfully`);
      
    } catch (error) {
      console.error(`Failed to connect processor ${id}:`, error);
      // Remove from processors and restore direct connection
      connectedProcessors.current.delete(id);
      restoreDirectConnection();
    }
  };

  const disconnectFromChain = (processorId: string) => {
    try {
      console.log(`Disconnecting processor ${processorId}...`);
      
      if (connectedProcessors.current.has(processorId)) {
        connectedProcessors.current.delete(processorId);
        rebuildAudioChain();
        console.log(`Processor ${processorId} disconnected successfully`);
      }
    } catch (error) {
      console.error(`Failed to disconnect processor ${processorId}:`, error);
    }
  };

  const rebuildAudioChain = () => {
    if (!analyserNode || !masterGainNode) return;
    
    try {
      // Disconnect everything first
      analyserNode.disconnect();
      connectedProcessors.current.forEach(({ input, output }) => {
        try {
          input.disconnect();
          if (output !== input) output.disconnect();
        } catch (e) {
          // Node might already be disconnected
        }
      });
      
      // If no processors, connect directly
      if (connectedProcessors.current.size === 0) {
        analyserNode.connect(masterGainNode);
        console.log('Restored direct analyser->masterGain connection');
        return;
      }
      
      // Build chain: analyser -> processor1 -> processor2 -> ... -> masterGain
      const processors = Array.from(connectedProcessors.current.values());
      let currentOutput: AudioNode = analyserNode;
      
      processors.forEach(({ input, output }, index) => {
        currentOutput.connect(input);
        currentOutput = output;
      });
      
      // Connect the last processor to master gain
      currentOutput.connect(masterGainNode);
      
      console.log(`Audio chain rebuilt with ${processors.length} processors`);
      
    } catch (error) {
      console.error('Failed to rebuild audio chain:', error);
      restoreDirectConnection();
    }
  };

  const restoreDirectConnection = () => {
    try {
      if (analyserNode && masterGainNode) {
        analyserNode.disconnect();
        analyserNode.connect(masterGainNode);
        console.log('Restored direct connection as fallback');
      }
    } catch (error) {
      console.error('Failed to restore direct connection:', error);
    }
  };

  const resetAudioBus = () => {
    // Clear all connected processors
    connectedProcessors.current.clear();
    
    // Disconnect all connected nodes
    connectedNodes.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Node already disconnected
      }
    });
    connectedNodes.current.clear();
    
    // Restore the original connection: analyser -> masterGain -> destination
    if (analyserNode && masterGainNode) {
      try {
        // Disconnect existing connections
        analyserNode.disconnect();
        masterGainNode.disconnect();
        
        // Reconnect in clean state
        analyserNode.connect(masterGainNode);
        masterGainNode.connect(audioContext!.destination);
        
        console.log('Audio bus reset successfully - all processors disconnected');
      } catch (error) {
        console.warn('Failed to reset audio bus connections:', error);
      }
    }
  };

  const initializeOnUserAction = async () => {
    if (!audioElement || (audioContext && audioContext.state !== 'closed')) {
      console.log('Audio processor already initialized or no audio element');
      return;
    }

    try {
      console.log('Initializing audio processor on user action...');
      
      // Create AudioContext with user interaction
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('AudioContext created, state:', ctx.state);
      
      // Resume context if suspended (required for Safari/iOS)
      if (ctx.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await ctx.resume();
        console.log('Audio context resumed, new state:', ctx.state);
      }
      
      // Check if audio element already has a source node
      if ((audioElement as any).__hasSourceNode) {
        console.warn('Audio element already has a source node, cleaning up first');
        delete (audioElement as any).__hasSourceNode;
      }
      
      console.log('Creating audio nodes...');
      const source = ctx.createMediaElementSource(audioElement);
      const analyser = ctx.createAnalyser();
      const masterGain = ctx.createGain();

      // Mark audio element to prevent duplicate source nodes
      (audioElement as any).__hasSourceNode = true;

      // Configure with safer values for production
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      masterGain.gain.value = 0.3;

      console.log('Connecting audio nodes...');
      // Connect: source -> analyser -> masterGain -> destination
      source.connect(analyser);
      analyser.connect(masterGain);
      masterGain.connect(ctx.destination);

      setAudioContext(ctx);
      setSourceNode(source);
      setAnalyserNode(analyser);
      setMasterGainNode(masterGain);

      console.log('Audio processor initialized successfully with analyser:', !!analyser);
    } catch (error) {
      console.error('Failed to initialize shared audio processor on user action:', error);
      cleanup();
    }
  };

  const getAnalyserData = () => {
    return {
      analyser: analyserNode,
      isConnected: analyserNode !== null && audioContext !== null && audioContext.state === 'running'
    };
  };

  const value = {
    audioContext,
    sourceNode,
    analyserNode,
    masterGainNode,
    connectToChain,
    disconnectFromChain,
    resetAudioBus,
    initializeOnUserAction,
    getAnalyserData,
  };

  return (
    <SharedAudioProcessorContext.Provider value={value}>
      {children}
    </SharedAudioProcessorContext.Provider>
  );
};