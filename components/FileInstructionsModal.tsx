
import React from 'react';
import { XIcon, InfoIcon } from './icons';
import { t, Language } from '../utils/translations';

interface FileInstructionsModalProps {
  fileName: string;
  onClose: () => void;
  onConfirm: () => void;
  lang: Language;
}

export const FileInstructionsModal: React.FC<FileInstructionsModalProps> = ({
  fileName,
  onClose,
  onConfirm,
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
            <InfoIcon className="w-7 h-7 text-[var(--accent-primary)]" />
            <span>{t('instructions', lang)}</span>
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4 text-[var(--text-secondary)]">
            <p dangerouslySetInnerHTML={{ __html: t('fileInstructionP1', lang, { fileName: `<strong class="text-[var(--accent-primary)]">${fileName}</strong>` }) }} />
            <p>{t('fileInstructionP2', lang)}</p>
            <ul className="list-decimal list-inside space-y-2 pl-4 bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)]">
                <li>{t('fileInstructionL1', lang, { strong: (text) => `<strong class="text-[var(--text-primary)]">${text}</strong>` })}</li>
                <li>{t('fileInstructionL2', lang, { strong: (text) => `<strong class="text-[var(--text-primary)]">${text}</strong>` })}</li>
                <li dangerouslySetInnerHTML={{ __html: t('fileInstructionL3', lang, { strong: (text) => `<strong class="text-[var(--text-primary)]">${text}</strong>` }) }} />
            </ul>
            <p className="text-xs text-[var(--text-placeholder)]">{t('fileInstructionNote', lang)}</p>
        </div>
         <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)] transition-colors"
            >
              {t('cancel', lang)}
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors"
            >
              {t('continue', lang)}
            </button>
          </div>
      </div>
    </div>
  );
};