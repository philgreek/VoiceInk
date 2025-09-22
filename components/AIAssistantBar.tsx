import React, { useState } from 'react';
import { SparklesIcon, SendIcon } from './icons';
import { t, Language } from '../utils/translations';

interface AIAssistantBarProps {
  onProofread: () => void;
  onAskAI: (prompt: string) => void;
  isProcessing: boolean;
  lang: Language;
}

export const AIAssistantBar: React.FC<AIAssistantBarProps> = ({ onProofread, onAskAI, isProcessing, lang }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      onAskAI(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <div className="flex-shrink-0 bg-[var(--bg-surface)] p-3 border-t border-[var(--border-color)] sticky bottom-[104px] sm:bottom-[112px] z-20 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <button
          onClick={onProofread}
          disabled={isProcessing}
          className="px-3 py-2 flex items-center gap-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md text-[var(--text-primary)] font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          <SparklesIcon className="w-5 h-5 text-[var(--accent-assistant)]" />
          <span className="hidden sm:inline">{t('aiProofread', lang)}</span>
        </button>
        <form onSubmit={handleSubmit} className="flex-grow flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('aiAsk', lang)}
            disabled={isProcessing}
            className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-l-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none placeholder-[var(--text-placeholder)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isProcessing}
            className="p-2 bg-[var(--accent-primary)] text-white rounded-r-md hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-wait"
            aria-label={t('aiSubmit', lang)}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
