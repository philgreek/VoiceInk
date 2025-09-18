import React from 'react';
import { XIcon } from './icons';
import { t, Language } from '../utils/translations';
import { Settings, SelectionContext } from '../types';

interface ContextualActionBarProps {
  settings: Settings;
  selectionContext: SelectionContext;
  onSplit: (messageId: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => void;
  onClear: () => void;
  lang: Language;
}

export const ContextualActionBar: React.FC<ContextualActionBarProps> = ({
  settings,
  selectionContext,
  onSplit,
  onClear,
  lang,
}) => {
  const speakerOptions = [
    { type: 'user' as const, profile: settings.user, label: t('you', lang) },
    { type: 'interlocutor' as const, profile: settings.interlocutor, label: t('speaker', lang) },
  ];

  return (
    // Centering wrapper
    <div className="fixed bottom-24 sm:bottom-28 inset-x-0 z-20 flex justify-center px-4 pointer-events-none">
      {/* Smaller, interactable panel */}
      <div className="bg-[var(--bg-surface)] rounded-xl shadow-2xl border border-[var(--border-color)] p-2 flex items-center justify-between gap-3 animate-fade-in-up w-full max-w-xs pointer-events-auto">
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)] pl-1">{t('splitAs', lang)}</span>
            <div className="flex gap-2">
              {speakerOptions.map(({ type, profile, label }) => (
                <button
                    key={type}
                    onClick={() => onSplit(selectionContext.messageId, selectionContext.text, type)}
                    // Smaller buttons
                    className={`w-8 h-8 rounded-full ${profile.avatarColor} flex items-center justify-center font-bold text-slate-300 transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-white/50`}
                    title={`${t('splitInto', lang)} ${label} (${profile.initial})`}
                >
                    {profile.initial}
                </button>
              ))}
            </div>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={t('close', lang)}
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
