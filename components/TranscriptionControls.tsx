
import React from 'react';
import { MicIcon, SparklesIcon, PlayIcon, PauseIcon, StopIcon } from './icons';
import { t, Language } from '../utils/translations';

interface TranscriptionControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isPushToTalkActive: boolean;
  onStartClick: () => void;
  onStopClick: () => void;
  onPauseClick: () => void;
  onMicToggle: () => void;
  lang: Language;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  isRecording,
  isPaused,
  isPushToTalkActive,
  onStartClick,
  onStopClick,
  onPauseClick,
  onMicToggle,
  lang,
}) => {
  const isPttDisabled = !isRecording || isPaused;

  const baseButtonClasses = 'p-3 rounded-full transition-all duration-200 flex items-center justify-center select-none text-white';
    
  const pushToTalkButtonClasses = isPushToTalkActive
    ? 'bg-slate-700/50'
    : 'hover:bg-slate-700/50';

  return (
    <div 
        className="flex items-stretch justify-center gap-2"
        data-tour-id="transcription-controls"
    >
      <button
        onClick={onMicToggle}
        disabled={isPttDisabled}
        className={`${baseButtonClasses} ${
          !isPttDisabled ? pushToTalkButtonClasses : 'text-slate-600 cursor-not-allowed'
        }`}
        aria-label={t('toggleUserMic', lang)}
      >
        <MicIcon className={`w-5 h-5 transition-colors ${isPushToTalkActive ? 'text-red-500' : 'text-white'}`} />
      </button>

      {!isRecording ? (
         <button
            onClick={onStartClick}
            className={`${baseButtonClasses} bg-green-500 hover:bg-green-600`}
            aria-label={t('start', lang)}
          >
            <PlayIcon className="w-5 h-5" />
          </button>
      ) : (
        <>
           <button
            onClick={onPauseClick}
            className={`${baseButtonClasses} ${
                isPaused 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
            aria-label={isPaused ? t('resume', lang) : t('pause', lang)}
          >
            {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
          </button>
           <button
            onClick={onStopClick}
            className={`${baseButtonClasses} bg-red-600 hover:bg-red-700`}
            aria-label={t('stop', lang)}
          >
            <StopIcon className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};
