
import React from 'react';
import { MicIcon, SparklesIcon, PlayIcon, PauseIcon, StopIcon } from './icons';
import { t, Language } from '../utils/translations';

interface TranscriptionControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isPushToTalkActive: boolean;
  isAIAssistantOpen: boolean;
  onStartClick: () => void;
  onStopClick: () => void;
  onPauseClick: () => void;
  onMicToggle: () => void;
  onAIToggle: () => void;
  lang: Language;
}

export const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  isRecording,
  isPaused,
  isPushToTalkActive,
  isAIAssistantOpen,
  onStartClick,
  onStopClick,
  onPauseClick,
  onMicToggle,
  onAIToggle,
  lang,
}) => {
  const pushToTalkButtonClasses = isPushToTalkActive
    ? 'bg-[var(--bg-element-hover)]'
    : 'bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)]';
    
  const isPttDisabled = !isRecording || isPaused;

  const baseButtonClasses = 'font-bold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-white text-xl flex items-center justify-center select-none';
  
  const aiButtonClasses = isAIAssistantOpen
    ? 'bg-[var(--accent-assistant)] text-white ring-2 ring-offset-2 ring-offset-[var(--bg-header)] ring-white'
    : 'bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] text-white';

  return (
    <div 
      className="flex-shrink-0 bg-[var(--bg-header)] backdrop-blur-sm p-4 sm:p-6 border-t border-[var(--border-color)] sticky bottom-0 z-20"
    >
        <div 
          className="flex items-stretch justify-center gap-4 max-w-lg mx-auto"
          data-tour-id="transcription-controls"
        >
          <button
            onClick={onAIToggle}
            className={`${baseButtonClasses} flex-grow-0 w-20 ${aiButtonClasses}`}
            aria-label={t('toggleAIInsights', lang)}
          >
            <SparklesIcon className="w-8 h-8"/>
          </button>
          
          <button
            onClick={onMicToggle}
            disabled={isPttDisabled}
            className={`${baseButtonClasses} flex-grow-0 w-20 ${
              !isPttDisabled ? pushToTalkButtonClasses : 'bg-[var(--bg-surface)] text-[var(--text-placeholder)] cursor-not-allowed'
            }`}
            aria-label={t('toggleUserMic', lang)}
          >
            <MicIcon className={`w-8 h-8 transition-colors ${isPushToTalkActive ? 'text-red-500' : 'text-white'}`} />
          </button>

          {!isRecording ? (
             <button
                onClick={onStartClick}
                className={`${baseButtonClasses} flex-1 bg-green-600 hover:bg-green-700`}
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
                    ? 'bg-green-600 hover:bg-green-700' 
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
    </div>
  );
};
