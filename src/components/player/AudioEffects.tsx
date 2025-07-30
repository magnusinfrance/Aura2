import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw } from 'lucide-react';

interface AudioEffectsProps {
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
}

export const AudioEffects: React.FC<AudioEffectsProps> = ({ audioContext, audioElement }) => {
  const [reverbEnabled, setReverbEnabled] = useState(false);
  const [reverbAmount, setReverbAmount] = useState([30]);
  const [delayEnabled, setDelayEnabled] = useState(false);
  const [delayTime, setDelayTime] = useState([0.3]);
  const [delayFeedback, setDelayFeedback] = useState([30]);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [compressionRatio, setCompressionRatio] = useState([4]);
  
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const feedbackGainRef = useRef<GainNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (audioContext && audioElement && !sourceRef.current) {
      try {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
        setupEffects();
      } catch (error) {
        console.warn('Audio effects setup failed:', error);
      }
    }
  }, [audioContext, audioElement]);

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
    if (!audioContext || !sourceRef.current) return;

    // Create reverb
    reverbNodeRef.current = audioContext.createConvolver();
    const reverbImpulse = createReverbImpulse(3, 2);
    if (reverbImpulse) {
      reverbNodeRef.current.buffer = reverbImpulse;
    }

    // Create delay
    delayNodeRef.current = audioContext.createDelay(1);
    feedbackGainRef.current = audioContext.createGain();
    delayGainRef.current = audioContext.createGain();
    
    // Create compressor
    compressorRef.current = audioContext.createDynamicsCompressor();
    
    // Connect delay feedback loop
    if (delayNodeRef.current && feedbackGainRef.current && delayGainRef.current) {
      delayNodeRef.current.connect(feedbackGainRef.current);
      feedbackGainRef.current.connect(delayNodeRef.current);
      delayNodeRef.current.connect(delayGainRef.current);
    }

    updateEffectChain();
  };

  const updateEffectChain = () => {
    if (!audioContext || !sourceRef.current) return;

    // Disconnect all
    sourceRef.current.disconnect();
    if (reverbNodeRef.current) reverbNodeRef.current.disconnect();
    if (delayGainRef.current) delayGainRef.current.disconnect();
    if (compressorRef.current) compressorRef.current.disconnect();

    let currentNode = sourceRef.current;

    // Connect effects in order
    if (reverbEnabled && reverbNodeRef.current) {
      currentNode.connect(reverbNodeRef.current);
      currentNode = reverbNodeRef.current as any;
    }

    if (delayEnabled && delayGainRef.current) {
      currentNode.connect(delayGainRef.current);
      currentNode = delayGainRef.current as any;
    }

    if (compressionEnabled && compressorRef.current) {
      currentNode.connect(compressorRef.current);
      currentNode = compressorRef.current as any;
    }

    // Connect to destination
    currentNode.connect(audioContext.destination);
  };

  const updateReverb = () => {
    if (reverbNodeRef.current) {
      const wetGain = audioContext?.createGain();
      if (wetGain) {
        wetGain.gain.value = reverbAmount[0] / 100;
      }
    }
    updateEffectChain();
  };

  const updateDelay = () => {
    if (delayNodeRef.current && feedbackGainRef.current) {
      delayNodeRef.current.delayTime.value = delayTime[0];
      feedbackGainRef.current.gain.value = delayFeedback[0] / 100;
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
    setCompressionEnabled(false);
    setCompressionRatio([4]);
    updateEffectChain();
  };

  useEffect(updateReverb, [reverbEnabled, reverbAmount]);
  useEffect(updateDelay, [delayEnabled, delayTime, delayFeedback]);
  useEffect(updateCompression, [compressionEnabled, compressionRatio]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Audio Effects</h3>
        <Button variant="ghost" size="sm" onClick={resetEffects}>
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      <Tabs defaultValue="reverb" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reverb" className="text-xs">Reverb</TabsTrigger>
          <TabsTrigger value="delay" className="text-xs">Delay</TabsTrigger>
          <TabsTrigger value="comp" className="text-xs">Comp</TabsTrigger>
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
      </Tabs>
    </div>
  );
};