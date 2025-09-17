

import React, { useRef, useCallback } from 'react';
import { MicIcon } from './icons';
import { t, Language } from '../utils/translations';

interface TranscriptionControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isPushToTalkActive: boolean;
  isTranscribingFile: boolean;
  onStartStopClick: () => void;
  onPause: () => void;
  onMicToggle: () => void;
  lang: Language;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  isRecording,
  isPaused,
  isPushToTalkActive,
  isTranscribingFile,
  onStartStopClick,
  onPause,
  onMicToggle,
  lang,
}) => {
  const pauseTimerRef = useRef<number | null>(null);

  const handleMainButtonDown = useCallback(() => {
    if (isTranscribingFile) return;
    // Set a timer for 1 second to trigger the pause action.
    pauseTimerRef.current = window.setTimeout(() => {
      onPause();
      pauseTimerRef.current = null; // Timer has fired, nullify it.
    }, 1000);
  }, [onPause, isTranscribingFile]);

  const handleMainButtonUp = useCallback(() => {
    if (isTranscribingFile) {
        onStartStopClick(); // For file transcription, any click is a stop.
        return;
    }
    // If the timer is still active, it means it was a short press (a 'click').
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
      onStartStopClick();
    }
    // If timer is null, it means the long-press already fired, so do nothing on mouse up.
  }, [onStartStopClick, isTranscribingFile]);

  const buttonTextKey = !isRecording ? 'start' : isPaused ? 'resume' : 'stop';
  const buttonText = t(buttonTextKey, lang);

  const startStopButtonClasses = !isRecording
    ? 'bg-green-600 hover:bg-green-700'
    : isPaused
    ? 'bg-amber-500 hover:bg-amber-600'
    : 'bg-red-600 hover:bg-red-700';

  const pushToTalkButtonClasses = isPushToTalkActive
    ? 'bg-[var(--bg-element-hover)]' // Subtle active state
    : 'bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)]';
    
  const isPttDisabled = !isRecording || isPaused || isTranscribingFile;

  const baseButtonClasses = 'flex-1 font-bold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-white text-xl flex items-center justify-center';

  return (
    <div className="flex-shrink-0 bg-[var(--bg-header)] backdrop-blur-sm p-4 sm:p-6 border-t border-[var(--border-color)] sticky bottom-0">
        <div className="flex items-stretch justify-center gap-4 max-w-lg mx-auto">
          <button
            onClick={onMicToggle}
            disabled={isPttDisabled}
            className={`${baseButtonClasses} ${
              !isPttDisabled ? pushToTalkButtonClasses : 'bg-[var(--bg-surface)] text-[var(--text-placeholder)] cursor-not-allowed'
            }`}
            aria-label={t('toggleUserMic', lang)}
          >
            <MicIcon className={`w-8 h-8 transition-colors ${isPushToTalkActive ? 'text-red-500' : 'text-white'}`} />
          </button>
          <button
            onMouseDown={handleMainButtonDown}
            onMouseUp={handleMainButtonUp}
            onTouchStart={handleMainButtonDown}
            onTouchEnd={handleMainButtonUp}
            className={`${baseButtonClasses} ${startStopButtonClasses}`}
          >
            {buttonText}
          </button>
        </div>
    </div>
  );
};
