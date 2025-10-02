
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { PlayIcon, PauseIcon } from './icons';

interface AudioPlayerProps {
  blob: Blob | null;
  onTimeUpdate: (time: number) => void;
  isVisible?: boolean;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({ blob, onTimeUpdate, isVisible }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const audioURL = React.useMemo(() => blob ? URL.createObjectURL(blob) : null, [blob]);

  useEffect(() => {
    const audio = localAudioRef.current;
    if (audio && audioURL) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      };
      
      const setAudioTime = () => {
        const time = audio.currentTime;
        setCurrentTime(time);
        onTimeUpdate(time);
      };

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.load(); // Force load for mobile browsers

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
      };
    }
  }, [onTimeUpdate, audioURL]); // Re-run when audioURL changes

  useEffect(() => {
      // Clean up the object URL when the component unmounts or URL changes
      return () => {
        if (audioURL) {
            URL.revokeObjectURL(audioURL);
        }
      }
  }, [audioURL]);

  const handlePlayPause = () => {
    const audio = localAudioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = localAudioRef.current;
    if(audio) {
        const time = parseFloat(event.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!blob || !isVisible) {
      return null;
  }

  return (
    <div className="flex items-center gap-4 p-2 bg-slate-800/70 backdrop-blur-md rounded-full shadow-lg border border-slate-700">
       <audio
        ref={(node) => {
            localAudioRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        }}
        src={audioURL ?? undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={handlePlayPause}
        className="p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-full text-[var(--text-primary)] transition-colors"
      >
        {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
      </button>
      <div className="flex-grow flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-secondary)]">{formatTime(currentTime)}</span>
          <input 
              type="range" 
              min="0"
              max={duration || 1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
          />
          <span className="text-xs font-mono text-[var(--text-secondary)]">{formatTime(duration)}</span>
      </div>
    </div>
  );
});
