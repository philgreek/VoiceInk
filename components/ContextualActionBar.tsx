import React from 'react';
import type { Settings, SelectionContext } from '../types';
import { t, Language } from '../utils/translations';
import { XIcon } from './icons';

interface ContextualActionBarProps {
  onSplit: (messageId: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => void;
  onClear: () => void;
  context: SelectionContext;
  settings: Settings;
  lang: Language;
}

export const ContextualActionBar: React.FC<ContextualActionBarProps> = ({ onSplit, onClear, context, settings, lang }) => {
    
  const speakerOptions = [
    { type: 'user' as const, profile: settings.user },
    { type: 'interlocutor' as const, profile: settings.interlocutor },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 p-2 sm:p-4 flex justify-center">
      <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-lg shadow-2xl border border-[var(--border-color)] flex items-center gap-4 p-2 transition-all animate-in slide-in-from-bottom-5 duration-300 max-w-md w-full">
        <div className="flex-grow pl-2">
            <p className="text-sm font-semibold truncate" title={context.text}>{t('splitSelection', lang)}</p>
            <p className="text-xs text-[var(--text-secondary)]">{t('splitAs', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
            {speakerOptions.map(({ type, profile }) => (
                <button
                    key={type}
                    onClick={() => onSplit(context.messageId, context.text, type)}
                    className={`w-10 h-10 rounded-full ${profile.avatarColor} flex items-center justify-center font-bold text-slate-300 transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-white/50`}
                    title={`${t('splitInto', lang)} ${type === 'user' ? t('you', lang) : t('speaker', lang)} (${profile.initial})`}
                >
                    {profile.initial}
                </button>
            ))}
        </div>
        <button onClick={onClear} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label={t('close', lang)}>
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};