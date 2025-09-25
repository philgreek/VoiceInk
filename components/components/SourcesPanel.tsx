

import React from 'react';
import { Source } from '../types';
import { t, Language } from '../utils/translations';
import { PlusCircleIcon, TrashIcon, FileAudioIcon, FileTextIcon, LinkIcon, MicIcon, FileIcon } from './icons';

interface SourcesPanelProps {
  isOpen: boolean;
  sources: Source[];
  onAddSource: () => void;
  onRemoveSource: (sourceId: string) => void;
  lang: Language;
}

const SourceIcon: React.FC<{ type: Source['type'] }> = ({ type }) => {
    switch (type) {
        case 'transcription': return <MicIcon className="w-5 h-5 text-[var(--accent-primary)]" />;
        case 'audio': return <FileAudioIcon className="w-5 h-5 text-purple-400" />;
        case 'file': return <FileTextIcon className="w-5 h-5 text-blue-400" />;
        case 'url': return <LinkIcon className="w-5 h-5 text-green-400" />;
        default: return <FileIcon className="w-5 h-5 text-[var(--text-secondary)]" />;
    }
};

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  isOpen,
  sources,
  onAddSource,
  onRemoveSource,
  lang,
}) => {
  const asideClasses = `
    relative z-10 overflow-hidden flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col
    transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'}
  `;

  return (
    <aside className={asideClasses}>
      <header className="p-4 flex justify-between items-center border-b border-[var(--border-color)] flex-shrink-0">
        <h2 className="text-xl font-bold">{t('sources', lang)}</h2>
        <button 
            onClick={onAddSource} 
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)] rounded-full"
            title={t('addSource', lang)}
        >
          <PlusCircleIcon className="w-6 h-6" />
        </button>
      </header>
      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {sources.map(source => (
          <div key={source.id} className="group bg-[var(--bg-element)] p-3 rounded-lg flex justify-between items-center gap-2">
            <div className="flex items-center gap-3 min-w-0">
                <SourceIcon type={source.type} />
                <div className="truncate">
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate" title={source.name}>{source.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{t(`sourceType${source.type.charAt(0).toUpperCase() + source.type.slice(1)}` as any, lang)}</p>
                </div>
            </div>
            <button 
                onClick={() => onRemoveSource(source.id)}
                className="p-1 text-[var(--text-secondary)] hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('removeSource', lang)}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};