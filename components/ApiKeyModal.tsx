
import React, { useState } from 'react';
import { XIcon, KeyIcon } from './icons';
import { t, Language } from '../utils/translations';

interface ApiKeyModalProps {
  onClose: () => void;
  onSave: (apiKey: string) => void;
  lang: Language;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave, lang }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

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
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <KeyIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <span>{t('apiKeyTitle', lang)}</span>
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">{t('apiKeyDescription', lang)}</p>
          <div>
            <label htmlFor="api-key-input" className="sr-only">{t('apiKeyInputPlaceholder', lang)}</label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('apiKeyInputPlaceholder', lang)}
              className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-3 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
            />
          </div>
          <div className="text-center">
             <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-[var(--accent-primary)] hover:underline"
            >
                {t('apiKeyLinkText', lang)}
            </a>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)] transition-colors"
          >
            {t('cancel', lang)}
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50"
          >
            {t('apiKeySave', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
