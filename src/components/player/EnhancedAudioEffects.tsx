import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw } from 'lucide-react';

interface EnhancedAudioEffectsProps {
  audioContext?: AudioContext | null;
  audioElement?: HTMLAudioElement | null;
  outputGain?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  crossfadeDuration?: number;
  gaplessPlayback?: boolean;
  onFadeInChange?: (value: number) => void;
  onFadeOutChange?: (value: number) => void;
  onCrossfadeChange?: (value: number) => void;
  onGaplessToggle?: (value: boolean) => void;
}

import { useSharedAudioProcessor } from './SharedAudioProcessor';

export const EnhancedAudioEffects: React.FC<EnhancedAudioEffectsProps> = ({ 
  audioContext: externalAudioContext, 
  audioElement: externalAudioElement, 
  outputGain = 0.6,
  fadeInDuration = 1000,
  fadeOutDuration = 1000,
  crossfadeDuration = 3000,
  gaplessPlayback = false,
  onFadeInChange,
  onFadeOutChange,
  onCrossfadeChange,
  onGaplessToggle
}) => {
  const { audioContext, sourceNode, analyserNode, masterGainNode, connectToChain, disconnectFromChain, resetAudioBus } = useSharedAudioProcessor();
  const [reverbEnabled, setReverbEnabled] = useState(false);
  const [reverbAmount, setReverbAmount] = useState([30]);
  const [delayEnabled, setDelayEnabled] = useState(false);
  const [delayTime, setDelayTime] = useState([0.3]);
  const [delayFeedback, setDelayFeedback] = useState([30]);
  const [echoEnabled, setEchoEnabled] = useState(false);
  const [echoTime, setEchoTime] = useState([0.5]);
  const [echoFeedback, setEchoFeedback] = useState([25]);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [compressionRatio, setCompressionRatio] = useState([4]);
  
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const echoNodeRef = useRef<DelayNode | null>(null);
  const echoGainRef = useRef<GainNode | null>(null);
  const echoFeedbackRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Only setup effects when needed, not automatically
    if (audioContext && masterGainNode && (reverbEnabled || delayEnabled || echoEnabled || compressionEnabled)) {
      setupEffects();
    }
  }, [audioContext, masterGainNode, reverbEnabled, delayEnabled, echoEnabled, compressionEnabled]);

  const createReverbImpulse = (duration: number, decay: number) => {
    if (!audioContext) return null;
    
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }
    
    return impulse;
  };

  const setupEffects = () => {
    if (!audioContext) return;

    try {
      // Create reverb
      reverbNodeRef.current = audioContext.createConvolver();
      reverbGainRef.current = audioContext.createGain();
      const reverbImpulse = createReverbImpulse(3, 2);
      if (reverbImpulse) {
        reverbNodeRef.current.buffer = reverbImpulse;
      }

      // Create delay
      delayNodeRef.current = audioContext.createDelay(1);
      delayGainRef.current = audioContext.createGain();
      delayFeedbackRef.current = audioContext.createGain();
      
      // Create echo (separate from delay)
      echoNodeRef.current = audioContext.createDelay(1);
      echoGainRef.current = audioContext.createGain();
      echoFeedbackRef.current = audioContext.createGain();
      
      // Create compressor
      compressorRef.current = audioContext.createDynamicsCompressor();
      
      // Output gain with reduced level to prevent distortion
      outputGainRef.current = audioContext.createGain();
      outputGainRef.current.gain.value = outputGain;
      
      // Setup delay feedback loop
      if (delayNodeRef.current && delayFeedbackRef.current) {
        delayNodeRef.current.connect(delayFeedbackRef.current);
        delayFeedbackRef.current.connect(delayNodeRef.current);
      }
      
      // Setup echo feedback loop
      if (echoNodeRef.current && echoFeedbackRef.current) {
        echoNodeRef.current.connect(echoFeedbackRef.current);
        echoFeedbackRef.current.connect(echoNodeRef.current);
      }

      updateEffectChain();
    } catch (error) {
      console.warn('Effects setup failed:', error);
    }
  };

  const updateEffectChain = () => {
    if (!audioContext || !outputGainRef.current) {
      console.log('Missing required audio nodes for effects');
      return;
    }

    try {
      console.log('Updating effect chain...', { 
        reverbEnabled, delayEnabled, echoEnabled, compressionEnabled 
      });
      
      // Disconnect all effect nodes safely
      try {
        if (reverbNodeRef.current) reverbNodeRef.current.disconnect();
        if (reverbGainRef.current) reverbGainRef.current.disconnect();
        if (delayNodeRef.current) delayNodeRef.current.disconnect();
        if (delayGainRef.current) delayGainRef.current.disconnect();
        if (echoNodeRef.current) echoNodeRef.current.disconnect();
        if (echoGainRef.current) echoGainRef.current.disconnect();
        if (compressorRef.current) compressorRef.current.disconnect();
        outputGainRef.current.disconnect();
      } catch (e) {
        // Expected disconnection errors
      }

      // Check if any effects are enabled
      const anyEffectsEnabled = reverbEnabled || delayEnabled || echoEnabled || compressionEnabled;
      
      if (!anyEffectsEnabled) {
        // No effects enabled - disconnect from audio chain
        console.log('No effects enabled, disconnecting from chain');
        disconnectFromChain('audioEffects');
        return;
      }

      // Create a mixer node that will receive all the effect outputs
      const mixerNode = audioContext.createGain();
      mixerNode.gain.value = 1.0;
      
      // Create wet paths for effects and connect them to the mixer
      const wetNodes: AudioNode[] = [];

      // We need an input node that connects to all effects
      const inputGain = audioContext.createGain();
      inputGain.gain.value = 1.0;

      // Reverb path
      if (reverbEnabled && reverbNodeRef.current && reverbGainRef.current) {
        inputGain.connect(reverbNodeRef.current);
        reverbNodeRef.current.connect(reverbGainRef.current);
        reverbGainRef.current.gain.value = reverbAmount[0] / 100;
        reverbGainRef.current.connect(mixerNode);
        wetNodes.push(reverbGainRef.current);
      }

      // Delay path
      if (delayEnabled && delayNodeRef.current && delayGainRef.current && delayFeedbackRef.current) {
        inputGain.connect(delayNodeRef.current);
        delayNodeRef.current.connect(delayGainRef.current);
        delayNodeRef.current.delayTime.value = delayTime[0];
        delayFeedbackRef.current.gain.value = delayFeedback[0] / 100;
        delayGainRef.current.gain.value = 0.5;
        delayGainRef.current.connect(mixerNode);
        wetNodes.push(delayGainRef.current);
      }

      // Echo path (separate from delay)
      if (echoEnabled && echoNodeRef.current && echoGainRef.current && echoFeedbackRef.current) {
        inputGain.connect(echoNodeRef.current);
        echoNodeRef.current.connect(echoGainRef.current);
        echoNodeRef.current.delayTime.value = echoTime[0];
        echoFeedbackRef.current.gain.value = echoFeedback[0] / 100;
        echoGainRef.current.gain.value = 0.4;
        echoGainRef.current.connect(mixerNode);
        wetNodes.push(echoGainRef.current);
      }

      // Connect dry signal to mixer as well
      inputGain.connect(mixerNode);

      // Connect mixer to output gain
      mixerNode.connect(outputGainRef.current);
      
      // Final output processing
      let finalOutput: AudioNode = outputGainRef.current;
      
      if (compressionEnabled && compressorRef.current) {
        // Connect through compressor
        outputGainRef.current.connect(compressorRef.current);
        finalOutput = compressorRef.current;
      }

      // Connect the effects chain to the audio processor
      connectToChain(inputGain, finalOutput, 'audioEffects');
      
      console.log('Effect chain updated successfully');
    } catch (error) {
      console.warn('Effect chain update failed:', error);
    }
  };

  const updateCompression = () => {
    if (compressorRef.current) {
      compressorRef.current.ratio.value = compressionRatio[0];
      compressorRef.current.threshold.value = -24;
      compressorRef.current.attack.value = 0.003;
      compressorRef.current.release.value = 0.25;
    }
  };

  const resetEffects = () => {
    setReverbEnabled(false);
    setReverbAmount([30]);
    setDelayEnabled(false);
    setDelayTime([0.3]);
    setDelayFeedback([30]);
    setEchoEnabled(false);
    setEchoTime([0.5]);
    setEchoFeedback([25]);
    setCompressionEnabled(false);
    setCompressionRatio([4]);
    updateEffectChain();
  };

  const resetAudioBusAndEffects = () => {
    resetEffects();
    resetAudioBus();
    // Force update the effect chain to ensure clean state
    setTimeout(() => {
      updateEffectChain();
    }, 100);
  };

  // Update output gain when prop changes
  useEffect(() => {
    if (outputGainRef.current) {
      outputGainRef.current.gain.value = outputGain;
    }
  }, [outputGain]);

  useEffect(() => {
    // Only update effect chain if we have a stable audio context
    if (audioContext && masterGainNode && analyserNode) {
      updateEffectChain();
    }
  }, [
    reverbEnabled, reverbAmount,
    delayEnabled, delayTime, delayFeedback,
    echoEnabled, echoTime, echoFeedback,
    compressionEnabled,
    audioContext, masterGainNode, analyserNode
  ]);
  
  useEffect(updateCompression, [compressionEnabled, compressionRatio]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Audio Effects</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={resetEffects} title="Reset Effects">
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetAudioBusAndEffects} title="Reset Audio Bus">
            <span className="text-xs">🔄</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reverb" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reverb" className="text-xs">Reverb</TabsTrigger>
          <TabsTrigger value="delay" className="text-xs">Delay</TabsTrigger>
          <TabsTrigger value="echo" className="text-xs">Echo</TabsTrigger>
          <TabsTrigger value="comp" className="text-xs">Comp</TabsTrigger>
          <TabsTrigger value="playback" className="text-xs">Playback</TabsTrigger>
        </TabsList>

        <TabsContent value="reverb" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="reverb-enable" className="text-xs">Enable</Label>
            <Switch
              id="reverb-enable"
              checked={reverbEnabled}
              onCheckedChange={setReverbEnabled}
            />
          </div>
          {reverbEnabled && (
            <div className="space-y-2">
              <Label className="text-xs">Amount: {reverbAmount[0]}%</Label>
              <Slider
                value={reverbAmount}
                onValueChange={setReverbAmount}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="delay" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="delay-enable" className="text-xs">Enable</Label>
            <Switch
              id="delay-enable"
              checked={delayEnabled}
              onCheckedChange={setDelayEnabled}
            />
          </div>
          {delayEnabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Time: {delayTime[0]}s</Label>
                <Slider
                  value={delayTime}
                  onValueChange={setDelayTime}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Feedback: {delayFeedback[0]}%</Label>
                <Slider
                  value={delayFeedback}
                  onValueChange={setDelayFeedback}
                  max={90}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="echo" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="echo-enable" className="text-xs">Enable</Label>
            <Switch
              id="echo-enable"
              checked={echoEnabled}
              onCheckedChange={setEchoEnabled}
            />
          </div>
          {echoEnabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Time: {echoTime[0]}s</Label>
                <Slider
                  value={echoTime}
                  onValueChange={setEchoTime}
                   min={0.2}
                   max={3.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Feedback: {echoFeedback[0]}%</Label>
                <Slider
                  value={echoFeedback}
                  onValueChange={setEchoFeedback}
                  max={80}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comp" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="comp-enable" className="text-xs">Enable</Label>
            <Switch
              id="comp-enable"
              checked={compressionEnabled}
              onCheckedChange={setCompressionEnabled}
            />
          </div>
          {compressionEnabled && (
            <div className="space-y-2">
              <Label className="text-xs">Ratio: {compressionRatio[0]}:1</Label>
              <Slider
                value={compressionRatio}
                onValueChange={setCompressionRatio}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="playback" className="space-y-3 mt-3">
          <div className="space-y-4">
            {/* Gapless Playback */}
            <div className="flex items-center justify-between">
              <Label htmlFor="gapless" className="text-xs">
                Gapless Playback
              </Label>
              <Switch
                id="gapless"
                checked={gaplessPlayback}
                onCheckedChange={onGaplessToggle}
              />
            </div>

            {/* Fade In Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Fade In</Label>
                <span className="text-xs text-muted-foreground">
                  {(fadeInDuration / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[fadeInDuration]}
                onValueChange={([value]) => onFadeInChange?.(value)}
                max={5000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Fade Out Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Fade Out</Label>
                <span className="text-xs text-muted-foreground">
                  {(fadeOutDuration / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[fadeOutDuration]}
                onValueChange={([value]) => onFadeOutChange?.(value)}
                max={5000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Crossfade Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Crossfade</Label>
                <span className="text-xs text-muted-foreground">
                  {(crossfadeDuration / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[crossfadeDuration]}
                onValueChange={([value]) => onCrossfadeChange?.(value)}
                max={10000}
                min={0}
                step={500}
                className="w-full"
              />
            </div>
            
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>• Gapless: Seamless track transitions</p>
              <p>• Fade In/Out: Smooth start/end</p>
              <p>• Crossfade: Blend between tracks</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};