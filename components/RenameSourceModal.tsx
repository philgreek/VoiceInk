import React, { useState } from 'react';
import { XIcon } from './icons';
import { Source } from '../types';
import { t, Language } from '../utils/translations';

interface RenameSourceModalProps {
  source: Source;
  onClose: () => void;
  onSave: (id: string, newName: string) => void;
  lang: Language;
}

export const RenameSourceModal: React.FC<RenameSourceModalProps> = ({ source, onClose, onSave, lang }) => {
  const [name, setName] = useState(source.name);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(source.id, name.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-md p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSave}>
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('rename', lang)} {t('source', lang)}</h2>
            <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <XIcon className="w-6 h-6" />
            </button>
            </div>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-3 text-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
            />
            <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)]">
                {t('cancel', lang)}
            </button>
            <button type="submit" disabled={!name.trim()} className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] disabled:opacity-50">
                {t('saveChanges', lang)}
            </button>
            </div>
        </form>
      </div>
    </div>
  );
};
