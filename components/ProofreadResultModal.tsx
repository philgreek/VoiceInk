
import React, { useState, useCallback } from 'react';
import { XIcon, ClipboardIcon, CheckIcon } from './icons';
import { t, Language } from '../utils/translations';

interface ProofreadResultModalProps {
  result: string;
  onClose: () => void;
  lang: Language;
}

export const ProofreadResultModal: React.FC<ProofreadResultModalProps> = ({ result, onClose, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-2xl p-6 sm:p-8 flex flex-col h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('proofreadResultTitle', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto bg-[var(--bg-subtle)] p-4 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] whitespace-pre-wrap">
            {result}
        </div>
        
        <div className="mt-6 flex justify-end gap-4 flex-shrink-0">
          <button
            onClick={handleCopy}
            className={`px-6 py-2 flex items-center gap-2 font-semibold rounded-md transition-colors ${
                copied 
                ? 'bg-green-600 text-white' 
                : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]'
            }`}
          >
            {copied ? <CheckIcon className="w-5 h-5" /> : <ClipboardIcon className="w-5 h-5" />}
            {copied ? t('copySuccess', lang).replace('!', '') : t('copy', lang)}
          </button>
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
