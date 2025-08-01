import React, { createContext, useContext, useRef, useEffect, useState } from 'react';

interface SharedAudioProcessorContextType {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyserNode: AnalyserNode | null;
  masterGainNode: GainNode | null;
  connectToChain: (inputNode: AudioNode, outputNode?: AudioNode) => void;
  disconnectFromChain: (node: AudioNode) => void;
  resetAudioBus: () => void;
  initializeOnUserAction: () => Promise<void>;
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

  const connectToChain = (inputNode: AudioNode, outputNode?: AudioNode) => {
    if (!masterGainNode || !analyserNode) {
      console.warn('Missing required nodes for audio chain connection');
      return;
    }
    
    try {
      // Check if connection already exists
      if (connectedNodes.current.has(inputNode)) {
        console.log('Node already connected to chain, skipping...');
        return;
      }
      
      console.log('Connecting node to audio chain...');
      
      // Safely disconnect existing direct connection between analyser and masterGain
      try {
        analyserNode.disconnect(masterGainNode);
        console.log('Disconnected direct analyser->masterGain connection');
      } catch (e) {
        // Connection might not exist, continue
        console.log('No direct connection to disconnect');
      }
      
      // Connect new chain: analyser -> inputNode -> (outputNode || masterGain)
      analyserNode.connect(inputNode);
      inputNode.connect(outputNode || masterGainNode);
      connectedNodes.current.add(inputNode);
      
      console.log('Node connected to audio chain successfully');
      
    } catch (error) {
      console.error('Failed to connect node to chain:', error);
      // Restore direct connection as fallback
      try {
        if (analyserNode && masterGainNode) {
          // First disconnect everything to clean up
          analyserNode.disconnect();
          
          // Reconnect directly
          analyserNode.connect(masterGainNode);
          console.log('Fallback connection restored');
        }
      } catch (fallbackError) {
        console.error('Fallback connection failed:', fallbackError);
      }
    }
  };

  const disconnectFromChain = (node: AudioNode) => {
    try {
      console.log('Disconnecting node from audio chain...');
      node.disconnect();
      connectedNodes.current.delete(node);
      
      // Restore direct connection if no other nodes are connected
      if (connectedNodes.current.size === 0 && analyserNode && masterGainNode) {
        try {
          // Ensure clean reconnection
          analyserNode.disconnect();
          analyserNode.connect(masterGainNode);
          console.log('Restored direct analyser->masterGain connection');
        } catch (e) {
          console.warn('Failed to restore direct connection:', e);
        }
      }
      console.log('Node disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect node from chain:', error);
    }
  };

  const resetAudioBus = () => {
    // Disconnect all connected nodes first
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
        
        console.log('Audio bus reset successfully');
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

  const value = {
    audioContext,
    sourceNode,
    analyserNode,
    masterGainNode,
    connectToChain,
    disconnectFromChain,
    resetAudioBus,
    initializeOnUserAction,
  };

  return (
    <SharedAudioProcessorContext.Provider value={value}>
      {children}
    </SharedAudioProcessorContext.Provider>
  );
};