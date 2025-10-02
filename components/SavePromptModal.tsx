
import React, { useState, useMemo } from 'react';
import { XIcon, BookmarkIcon } from './icons';
import { t, Language } from '../utils/translations';
import { Prompt } from '../types';

interface SavePromptModalProps {
  promptText: string;
  prompts: Prompt[];
  onClose: () => void;
  onSave: (name: string, category: string, text: string) => void;
  lang: Language;
}

export const SavePromptModal: React.FC<SavePromptModalProps> = ({ promptText, prompts, onClose, onSave, lang }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  const existingCategories = useMemo(() => {
    return [...new Set(prompts.map(p => p.category).filter(Boolean))];
  }, [prompts]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim() || t('newPrompt', lang), category.trim(), promptText);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-lg p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSave}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <BookmarkIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                <span>{t('savePrompt', lang)}</span>
            </h2>
            <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">{t('prompt', lang)}</p>
                <div className="max-h-24 overflow-y-auto p-3 bg-[var(--bg-element)] rounded-md text-sm text-[var(--text-secondary)] border border-[var(--border-color)]">
                    {promptText}
                </div>
            </div>
            <div>
              <label htmlFor="prompt-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('promptName', lang)}</label>
              <input
                type="text"
                id="prompt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('newPrompt', lang)}
                className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="prompt-category" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('promptCategory', lang)}</label>
              <input
                type="text"
                id="prompt-category"
                list="categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
              />
              <datalist id="categories">
                {existingCategories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)]">
              {t('cancel', lang)}
            </button>
            <button type="submit" className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)]">
              {t('saveChanges', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
