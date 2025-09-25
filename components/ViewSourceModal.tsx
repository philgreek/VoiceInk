import React from 'react';
import { XIcon } from './icons';
import { Source } from '../types';
import { t, Language } from '../utils/translations';

interface ViewSourceModalProps {
  source: Source;
  onClose: () => void;
  lang: Language;
}

export const ViewSourceModal: React.FC<ViewSourceModalProps> = ({ source, onClose, lang }) => {
  const content = Array.isArray(source.content) 
    ? source.content.map(m => m.text).join('\n')
    : source.content;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-3xl p-6 sm:p-8 flex flex-col h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] truncate" title={source.name}>{source.name}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] whitespace-pre-wrap">
          {content}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)]">
            {t('close', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
