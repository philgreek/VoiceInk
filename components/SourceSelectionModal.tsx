
import React from 'react';
import { XIcon, MicIcon, MonitorIcon, FileUploadIcon } from './icons';
import { t, Language } from '../utils/translations';

interface SourceSelectionModalProps {
  onClose: () => void;
  onSelectSource: (source: 'microphone' | 'display') => void;
  onFileSelectClick: () => void;
  lang: Language;
}

export const SourceSelectionModal: React.FC<SourceSelectionModalProps> = ({
  onClose,
  onSelectSource,
  onFileSelectClick,
  lang
}) => {
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-md p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('chooseAudioSource', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => onSelectSource('microphone')}
            className="w-full flex items-center gap-4 text-left p-4 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            <MicIcon className="w-6 h-6 text-[var(--accent-primary)] flex-shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)]">{t('microphone', lang)}</span>
              <p className="text-sm text-[var(--text-secondary)]">{t('microphoneDescription', lang)}</p>
            </div>
          </button>
          <button
            onClick={() => onSelectSource('display')}
            className="w-full flex items-center gap-4 text-left p-4 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            <MonitorIcon className="w-6 h-6 text-[var(--accent-primary)] flex-shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)]">{t('computerAudio', lang)}</span>
              <p className="text-sm text-[var(--text-secondary)]">{t('computerAudioDescription', lang)}</p>
            </div>
          </button>
          <button
            onClick={onFileSelectClick}
            className="w-full flex items-center gap-4 text-left p-4 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            <FileUploadIcon className="w-6 h-6 text-[var(--accent-primary)] flex-shrink-0" />
            <div>
              <span className="font-semibold text-[var(--text-primary)]">{t('uploadAudioFile', lang)}</span>
              <p className="text-sm text-[var(--text-secondary)]">{t('uploadAudioFileDescription', lang)}</p>
            </div>
          </button>
        </div>
         <div className="mt-6 text-xs text-[var(--text-placeholder)] text-center">
            <p>{t('sourceSelectionNote', lang)}</p>
        </div>
      </div>
    </div>
  );
};