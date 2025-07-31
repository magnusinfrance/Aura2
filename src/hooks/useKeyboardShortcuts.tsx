import { useEffect } from 'react';

export interface KeyboardShortcutsConfig {
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onMute: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcutKeys = ['Space', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'KeyM', 'KeyS', 'KeyR'];
      if (shortcutKeys.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
          config.onPlayPause();
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            config.onSeekForward();
          } else {
            config.onNext();
          }
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            config.onSeekBackward();
          } else {
            config.onPrevious();
          }
          break;
        case 'ArrowUp':
          config.onVolumeUp();
          break;
        case 'ArrowDown':
          config.onVolumeDown();
          break;
        case 'KeyM':
          config.onMute();
          break;
        case 'KeyS':
          config.onShuffle();
          break;
        case 'KeyR':
          config.onRepeat();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config]);
};

export const KEYBOARD_SHORTCUTS = [
  { key: 'Space', action: 'Play/Pause' },
  { key: '→', action: 'Next track' },
  { key: '←', action: 'Previous track' },
  { key: 'Shift + →', action: 'Seek forward 10s' },
  { key: 'Shift + ←', action: 'Seek backward 10s' },
  { key: '↑', action: 'Volume up' },
  { key: '↓', action: 'Volume down' },
  { key: 'M', action: 'Mute/Unmute' },
  { key: 'S', action: 'Toggle shuffle' },
  { key: 'R', action: 'Toggle repeat' },
];