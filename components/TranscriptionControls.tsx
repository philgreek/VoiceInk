import React from 'react';
import { MicIcon, SparklesIcon, PlayIcon, PauseIcon, StopIcon, CameraIcon, CameraOffIcon } from './icons';
import { t, Language } from '../utils/translations';

interface TranscriptionControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isVideoEnabled: boolean;
  onStartClick: () => void;
  onStopClick: () => void;
  onPauseClick: () => void;
  onToggleVideo: () => void;
  lang: Language;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  isRecording,
  isPaused,
  isVideoEnabled,
  onStartClick,
  onStopClick,
  onPauseClick,
  onToggleVideo,
  lang,
}) => {

  const baseButtonClasses = 'p-3 rounded-full transition-all duration-200 flex items-center justify-center select-none text-white';
    
  return (
    <div 
        className="flex items-stretch justify-center gap-2"
        data-tour-id="transcription-controls"
    >
       <button
        onClick={onToggleVideo}
        className={`${baseButtonClasses} ${
          isVideoEnabled ? 'bg-slate-700/50' : 'hover:bg-slate-700/50'
        }`}
        aria-label={'Toggle Video'}
      >
        {isVideoEnabled ? <CameraIcon className="w-5 h-5 text-red-500" /> : <CameraOffIcon className="w-5 h-5" />}
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