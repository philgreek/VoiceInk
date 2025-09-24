
import React from 'react';
import { XIcon, NotebookIcon } from './icons';
import { t, Language } from '../utils/translations';

interface NotebookLMInstructionsModalProps {
  fileName: string;
  onClose: () => void;
  lang: Language;
}

export const NotebookLMInstructionsModal: React.FC<NotebookLMInstructionsModalProps> = ({
  fileName,
  onClose,
  lang,
}) => {
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-lg p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <NotebookIcon className="w-7 h-7 text-purple-400" />
            <span>{t('notebookLMInstructionsTitle', lang)}</span>
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4 text-[var(--text-secondary)]">
            <p>{t('notebookLMInstructionsP1', lang)}</p>
            <p>{t('notebookLMInstructionsP2', lang)}</p>
            <ol className="list-decimal list-inside space-y-2 pl-4 bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
                <li>{t('notebookLMInstructionsL1', lang)}</li>
                <li>{t('notebookLMInstructionsL2', lang)}</li>
                <li>{t('notebookLMInstructionsL3', lang)}</li>
            </ol>
        </div>
         <div className="mt-8 flex justify-end gap-4">
             <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('notebookLMInstructionsLink', lang)}
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)] transition-colors"
            >
              {t('close', lang)}
            </button>
          </div>
      </div>
    </div>
  );
};
