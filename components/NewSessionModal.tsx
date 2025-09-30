
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { t, Language } from '../utils/translations';
import { SessionProfileId } from '../types';
import { profiles } from '../utils/profiles';

interface NewSessionModalProps {
  onClose: () => void;
  onConfirm: (name: string, profileId: SessionProfileId) => void;
  lang: Language;
  canContinue?: boolean;
  onContinue?: () => void;
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

export const NewSessionModal: React.FC<NewSessionModalProps> = ({ onClose, onConfirm, lang, canContinue, onContinue }) => {
    const [name, setName] = useState(getDefaultSessionName(lang));
    const [selectedProfileId, setSelectedProfileId] = useState<SessionProfileId>('pedagogical');
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!canContinue) {
            inputRef.current?.select();
        }
    }, [canContinue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim(), selectedProfileId);
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
            className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-2xl p-6 sm:p-8"
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">{canContinue ? t('continueOrNew', lang) : t('newSession', lang)}</h2>
                  <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>

                {canContinue && onContinue && (
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={onContinue}
                            className="w-full px-6 py-3 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors text-lg"
                        >
                            {t('continueCurrentSession', lang)}
                        </button>
                    </div>
                )}

                {canContinue && (
                     <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-[var(--border-color)]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[var(--bg-surface)] px-2 text-sm text-[var(--text-secondary)]">OR</span>
                        </div>
                    </div>
                )}
                
                <div className="space-y-6">
                    {canContinue && <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t('startNewSessionTitle', lang)}</h3>}
                    <div>
                        <label htmlFor="session-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('sessionNameTitle', lang)}</label>
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
                    <div>
                        <h3 className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('sessionProfile', lang)}</h3>
                        <p className="text-xs text-[var(--text-placeholder)] mb-3">{t('selectSessionProfile', lang)}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {Object.values(profiles).map(profile => (
                                <button
                                    type="button"
                                    key={profile.id}
                                    onClick={() => setSelectedProfileId(profile.id)}
                                    className={`p-3 text-center rounded-lg border-2 transition-colors ${selectedProfileId === profile.id ? 'border-[var(--accent-primary)] bg-[var(--bg-element)]' : 'border-transparent bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)]'}`}
                                >
                                    <profile.icon className="w-8 h-8 mx-auto mb-2 text-[var(--text-primary)]" />
                                    <span className="text-xs font-semibold text-[var(--text-primary)]">{t(profile.nameKey, lang)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
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
                      className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('start', lang)}
                    </button>
                  </div>
              </form>
          </div>
        </div>
    );
};
