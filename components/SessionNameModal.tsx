
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { t, Language } from '../utils/translations';

interface SessionNameModalProps {
  onClose: () => void;
  onConfirm: (name: string) => void;
  lang: Language;
}

const getDefaultSessionName = (lang: Language) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${t('sessionNameDefault', lang)} ${year}-${month}-${day} ${hours}:${minutes}`;
}

export const SessionNameModal: React.FC<SessionNameModalProps> = ({ onClose, onConfirm, lang }) => {
    const [name, setName] = useState(getDefaultSessionName(lang));
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus and select the input text for easy replacement
        inputRef.current?.select();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
        }
    }

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
            <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('sessionNameTitle', lang)}</h2>
                  <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                    <label htmlFor="session-name" className="sr-only">{t('sessionNameTitle', lang)}</label>
                    <input
                        ref={inputRef}
                        type="text"
                        id="session-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('sessionNamePlaceholder', lang)}
                        className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-3 text-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                    />
                </div>
                 <div className="mt-8 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)] transition-colors"
                    >
                      {t('cancel', lang)}
                    </button>
                    <button
                      type="submit"
                      disabled={!name.trim()}
                      className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('continue', lang)}
                    </button>
                  </div>
              </form>
          </div>
        </div>
    );
};
