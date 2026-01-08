import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AudioButtonProps {
  audioUrl: string;
  accent?: 'us' | 'uk';
  size?: 'small' | 'medium' | 'large';
  autoPlay?: boolean;
  shortcutKey?: string; // e.g., 'Control' for Ctrl key
  className?: string;
}

/**
 * AudioButton component for playing word/sentence audio
 * Supports keyboard shortcut (Ctrl by default)
 */
export const AudioButton: React.FC<AudioButtonProps> = ({
  audioUrl,
  accent = 'us',
  size = 'medium',
  autoPlay = false,
  shortcutKey = 'Control',
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10',
  };

  const playAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio playback failed, ignore
      });
    }
  }, []);

  const handlePlay = () => {
    playAudio();
  };

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === shortcutKey && !event.repeat) {
        event.preventDefault();
        playAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey, playAudio]);

  // Auto-play on mount
  useEffect(() => {
    if (autoPlay) {
      const timer = setTimeout(playAudio, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, playAudio]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlaying = () => setIsPlaying(true);
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="auto" />
      <button
        type="button"
        onClick={handlePlay}
        className={`
          flex items-center justify-center rounded-full
          bg-blue-100 hover:bg-blue-200 transition-colors
          ${sizeClasses[size]}
          ${isPlaying ? 'animate-pulse bg-blue-300' : ''}
          ${className}
        `}
        title={`Play ${accent.toUpperCase()} pronunciation (${shortcutKey})`}
        aria-label={`Play ${accent.toUpperCase()} pronunciation`}
      >
        <svg
          className={`${size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </>
  );
};
