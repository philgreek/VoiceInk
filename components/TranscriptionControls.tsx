

import React from 'react';
import { MicIcon } from './icons';
import { t, Language } from '../utils/translations';

interface TranscriptionControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isPushToTalkActive: boolean;
  isTranscribingFile: boolean;
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
  isTranscribingFile,
  onStartClick,
  onStopClick,
  onPauseClick,
  onMicToggle,
  lang,
}) => {
  const pushToTalkButtonClasses = isPushToTalkActive
    ? 'bg-[var(--bg-element-hover)]'
    : 'bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)]';
    
  const isPttDisabled = !isRecording || isPaused || isTranscribingFile;

  const baseButtonClasses = 'font-bold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-white text-xl flex items-center justify-center select-none';

  return (
    <div className="flex-shrink-0 bg-[var(--bg-header)] backdrop-blur-sm p-4 sm:p-6 border-t border-[var(--border-color)] sticky bottom-0">
        <div className="flex items-stretch justify-center gap-4 max-w-lg mx-auto">
          <button
            onClick={onMicToggle}
            disabled={isPttDisabled}
            className={`${baseButtonClasses} flex-grow-0 w-24 ${
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
              >
                {t('start', lang)}
              </button>
          ) : (
            <div className="flex-1 flex items-stretch gap-4">
               <button
                onClick={onPauseClick}
                disabled={isTranscribingFile}
                className={`${baseButtonClasses} flex-1 ${
                    isPaused 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-amber-500 hover:bg-amber-600'
                } disabled:bg-gray-500 disabled:cursor-not-allowed`}
              >
                {isPaused ? t('resume', lang) : t('pause', lang)}
              </button>
               <button
                onClick={onStopClick}
                className={`${baseButtonClasses} flex-1 bg-red-600 hover:bg-red-700`}
              >
                {t('stop', lang)}
              </button>
            </div>
          )}
        </div>
    </div>
  );
};