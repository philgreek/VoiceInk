
import React, { useState } from 'react';
import { XIcon, SearchIcon } from './icons';
import { t, Language } from '../utils/translations';

interface SearchSourcesModalProps {
  onClose: () => void;
  onSearch: (query: string, searchIn: 'internet' | 'drive') => void;
  lang: Language;
}

export const SearchSourcesModal: React.FC<SearchSourcesModalProps> = ({ onClose, onSearch, lang }) => {
  const [query, setQuery] = useState('');
  const [searchIn, setSearchIn] = useState<'internet' | 'drive'>('internet');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchIn);
    }
  };
  
  const handleSurpriseMe = () => {
      const topics = ["The history of the Silk Road", "Quantum computing explained simply", "The life cycle of a star", "The impact of the printing press"];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      setQuery(randomTopic);
  };

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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('searchSources', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="text-center mb-6">
            <div className="inline-block p-4 bg-[var(--bg-element)] rounded-full mb-4">
                <SearchIcon className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">{t('whatInterestsYou', lang)}</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPromptPlaceholder', lang)}
            rows={4}
            className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-3 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none resize-none"
          />

          <div className="mt-6">
            <p className="font-semibold text-sm text-[var(--text-secondary)] mb-2">{t('whereToSearch', lang)}</p>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchIn"
                  value="internet"
                  checked={searchIn === 'internet'}
                  onChange={() => setSearchIn('internet')}
                  className="w-4 h-4 accent-[var(--accent-primary)]"
                />
                <span className="text-[var(--text-primary)]">{t('internet', lang)}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchIn"
                  value="drive"
                  checked={searchIn === 'drive'}
                  onChange={() => setSearchIn('drive')}
                  className="w-4 h-4 accent-[var(--accent-primary)]"
                  disabled
                />
                <span className="text-[var(--text-placeholder)]">{t('googleDrive', lang)}</span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)] transition-colors"
            >
              {t('surpriseMe', lang)}
            </button>
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50"
            >
              {t('send', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
