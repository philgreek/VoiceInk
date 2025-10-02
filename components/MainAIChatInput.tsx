
import React from 'react';
import { SendIcon, SparklesIcon, BookmarkIcon, LightbulbIcon } from './icons';
import { t, Language } from '../utils/translations';

interface MainAIChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onAskAIAgent: () => void;
  isProcessing: boolean;
  lang: Language;
  onAgentConfigClick: () => void;
  onSavePromptClick: () => void;
  onToggleInsightMode: () => void;
  isInsightModeActive: boolean;
  isProcessingInsights: boolean;
}

export const MainAIChatInput: React.FC<MainAIChatInputProps> = ({ value, onChange, onAskAIAgent, isProcessing, lang, onAgentConfigClick, onSavePromptClick, onToggleInsightMode, isInsightModeActive, isProcessingInsights }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAskAIAgent();
    }
  };

  const baseButtonClass = "p-3 text-slate-300 hover:text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0";
  const insightButtonClass = isInsightModeActive ? 'bg-purple-500/30 text-purple-300' : 'hover:bg-slate-700/50';


  return (
    <div className="relative flex-grow">
      <form onSubmit={handleSubmit} className="flex items-center gap-1 w-full">
        <button
          type="button"
          onClick={onAgentConfigClick}
          disabled={isProcessing}
          className={`${baseButtonClass} hover:bg-slate-700/50`}
          aria-label={t('configureAgent', lang)}
        >
            <SparklesIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onToggleInsightMode}
          disabled={isProcessing || isProcessingInsights}
          className={`${baseButtonClass} ${insightButtonClass}`}
          aria-label={t('insightMode', lang)}
        >
            {isProcessingInsights ? (
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <LightbulbIcon className={`w-5 h-5 ${isInsightModeActive ? 'text-purple-300' : ''}`} />
            )}
        </button>
        <div className="relative flex-grow">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t('askAIAgent', lang)}
              disabled={isProcessing}
              className="w-full bg-transparent text-[var(--text-primary)] rounded-md py-3 pl-3 pr-20 focus:outline-none disabled:opacity-50"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
              {value.trim() && (
                <button
                  type="button"
                  onClick={onSavePromptClick}
                  className="p-1.5 text-slate-400 hover:text-white"
                  title={t('savePrompt', lang)}
                >
                  <BookmarkIcon className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isProcessing || !value.trim()}
                className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
        </div>
      </form>
    </div>
  );
};
