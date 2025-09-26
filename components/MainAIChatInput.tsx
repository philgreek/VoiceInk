
import React, { useState } from 'react';
import { SendIcon } from './icons';
import { t, Language } from '../utils/translations';

interface MainAIChatInputProps {
  onAskAIAgent: (prompt: string) => void;
  isProcessing: boolean;
  lang: Language;
}

export const MainAIChatInput: React.FC<MainAIChatInputProps> = ({ onAskAIAgent, isProcessing, lang }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onAskAIAgent(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <div className="flex-shrink-0 bg-[var(--bg-header)] backdrop-blur-sm p-4 border-t border-[var(--border-color)] z-20">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-lg mx-auto">
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
          className="p-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};
