
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

  const baseButtonClasses = 'font-bold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-white text-xl flex items-center justify-center select-none';
  
  const smallButtonBase = `bg-slate-800 hover:bg-slate-700`;
    
  const pushToTalkButtonClasses = isPushToTalkActive
    ? 'bg-slate-700'
    : smallButtonBase;

  return (
    <div 
        className="flex items-stretch justify-center gap-4"
        data-tour-id="transcription-controls"
    >
      <button
        onClick={onMicToggle}
        disabled={isPttDisabled}
        className={`${baseButtonClasses} flex-grow-0 w-20 ${
          !isPttDisabled ? pushToTalkButtonClasses : 'bg-slate-900 text-slate-600 cursor-not-allowed'
        }`}
        aria-label={t('toggleUserMic', lang)}
      >
        <MicIcon className={`w-8 h-8 transition-colors ${isPushToTalkActive ? 'text-red-500' : 'text-white'}`} />
      </button>

      {!isRecording ? (
         <button
            onClick={onStartClick}
            className={`${baseButtonClasses} flex-1 bg-green-500 hover:bg-green-600`}
            aria-label={t('start', lang)}
          >
            <PlayIcon className="w-8 h-8" />
          </button>
      ) : (
        <div className="flex-1 flex items-stretch gap-4 min-w-0">
           <button
            onClick={onPauseClick}
            className={`${baseButtonClasses} flex-1 min-w-0 ${
                isPaused 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-amber-500 hover:bg-amber-600'
            } disabled:bg-gray-500 disabled:cursor-not-allowed`}
            aria-label={isPaused ? t('resume', lang) : t('pause', lang)}
          >
            {isPaused ? <PlayIcon className="w-8 h-8" /> : <PauseIcon className="w-8 h-8" />}
          </button>
           <button
            onClick={onStopClick}
            className={`${baseButtonClasses} flex-1 min-w-0 bg-red-600 hover:bg-red-700`}
            aria-label={t('stop', lang)}
          >
            <StopIcon className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
};
