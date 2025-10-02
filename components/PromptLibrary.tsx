

import React, { useState, useMemo } from 'react';
import { Prompt } from '../types';
import { t, Language } from '../utils/translations';
import { SearchIcon, BookMarkedIcon, EllipsisVerticalIcon, EditIcon, TrashIcon, FileImportIcon, FileExportIcon } from './icons';

interface PromptLibraryProps {
  prompts: Prompt[];
  onUsePrompt: (text: string) => void;
  onUpdatePrompt: (prompt: Prompt) => void;
  onDeletePrompt: (promptId: string) => void;
  onOpenWizard: () => void;
  onExportPrompts: () => void;
  onImportPrompts: () => void;
  lang: Language;
}

const PromptItem: React.FC<{
    prompt: Prompt,
    onDoubleClick: () => void,
    onUpdate: (prompt: Prompt) => void,
    onDelete: (id: string) => void,
    lang: Language,
}> = ({ prompt, onDoubleClick, onUpdate, onDelete, lang }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(prompt.name);
    const [editedCategory, setEditedCategory] = useState(prompt.category);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = () => {
        onUpdate({ ...prompt, name: editedName.trim(), category: editedCategory.trim() });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-2 bg-slate-700/50 rounded-md space-y-2">
                <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full text-sm p-1 bg-slate-800 rounded-md border border-slate-600"/>
                <input type="text" value={editedCategory} onChange={e => setEditedCategory(e.target.value)} className="w-full text-xs p-1 bg-slate-800 rounded-md border border-slate-600"/>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="text-xs px-2 py-1 bg-cyan-600 rounded">{t('saveChanges', lang)}</button>
                    <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 bg-slate-600 rounded">{t('cancel', lang)}</button>
                </div>
            </div>
        )
    }

    return (
        <div onDoubleClick={onDoubleClick} title={t('doubleClickToUse', lang)} className="group flex items-start justify-between p-2 rounded-md hover:bg-[var(--bg-element-hover)] cursor-pointer">
            <div className="truncate flex-grow">
                <p className="text-sm font-medium text-slate-200 truncate">{prompt.name}</p>
                <p className="text-xs text-slate-500">{prompt.category}</p>
            </div>
            <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
                 <button onClick={() => setIsMenuOpen(p => !p)} className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100">
                    <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                     <div className="absolute right-0 top-full mt-1 z-10 bg-slate-900 border border-slate-700 rounded-md shadow-lg py-2 w-48">
                        <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2">
                            <EditIcon className="w-4 h-4"/> {t('editPrompt', lang)}
                        </button>
                        <button onClick={() => { if(window.confirm(t('deletePromptConfirmation', lang))) onDelete(prompt.id); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                            <TrashIcon className="w-4 h-4"/> {t('deletePrompt', lang)}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ prompts, onUsePrompt, onUpdatePrompt, onDeletePrompt, onOpenWizard, onExportPrompts, onImportPrompts, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => ['all', ...new Set(prompts.map(p => p.category).filter(Boolean))], [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
      const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) || prompt.text.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [prompts, searchTerm, selectedCategory]);

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
            <button onClick={onOpenWizard} className="flex-grow flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-md transition-colors">
                <BookMarkedIcon className="w-4 h-4" />
                <span>{t('promptWizard', lang)}</span>
            </button>
            <button onClick={onImportPrompts} title={t('importPrompts', lang)} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors">
                <FileImportIcon className="w-5 h-5" />
            </button>
            <button onClick={onExportPrompts} title={t('exportPrompts', lang)} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors">
                <FileExportIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPrompts', lang)}
            className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md py-2 pl-9 pr-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? t('allCategories', lang) : cat}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto mt-4 pr-2 -mr-4 space-y-1">
        {prompts.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">{t('noPromptsFound', lang)}</p>
        ) : filteredPrompts.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-6">{t('noPromptsMatchFilter', lang)}</p>
        ) : (
          filteredPrompts.map(prompt => (
            <PromptItem
              key={prompt.id}
              prompt={prompt}
              onDoubleClick={() => onUsePrompt(prompt.text)}
              onUpdate={onUpdatePrompt}
              onDelete={onDeletePrompt}
              lang={lang}
            />
          ))
        )}
      </div>
    </div>
  );
};