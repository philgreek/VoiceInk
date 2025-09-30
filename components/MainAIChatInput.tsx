
import React, { useState } from 'react';
import { SendIcon, SparklesIcon } from './icons';
import { t, Language } from '../utils/translations';

interface MainAIChatInputProps {
  onAskAIAgent: (prompt: string) => void;
  isProcessing: boolean;
  lang: Language;
  onAgentConfigClick: () => void;
}

export const MainAIChatInput: React.FC<MainAIChatInputProps> = ({ onAskAIAgent, isProcessing, lang, onAgentConfigClick }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onAskAIAgent(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <button
        type="button"
        onClick={onAgentConfigClick}
        disabled={isProcessing}
        className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        aria-label={t('configureAgent', lang)}
      >
          <SparklesIcon className="w-6 h-6" />
      </button>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={t('askAIAgent', lang)}
        disabled={isProcessing}
        className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-3 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isProcessing || !prompt.trim()}
        className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SendIcon className="w-6 h-6" />
      </button>
    </form>
  );
};
