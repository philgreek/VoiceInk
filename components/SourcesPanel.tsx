

import React, { useState, useRef, useEffect } from 'react';
import { Source } from '../types';
import { t, Language } from '../utils/translations';
import { PlusCircleIcon, TrashIcon, FileAudioIcon, FileTextIcon, LinkIcon, MicIcon, FileIcon, EllipsisVerticalIcon, EditIcon, ScanTextIcon, SendIcon } from './icons';

interface SourcesPanelProps {
  isOpen: boolean;
  sources: Source[];
  selectedSourceIds: string[];
  onAddSource: () => void;
  onRemoveSource: (sourceId: string) => void;
  onToggleSelection: (sourceId: string) => void;
  onRename: (source: Source) => void;
  onView: (source: Source) => void;
  onSendToChat: (sourceId: string) => void;
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

const SourceItemMenu: React.FC<{
    source: Source;
    onRename: () => void;
    onView: () => void;
    onSendToChat: () => void;
    onRemove: () => void;
    lang: Language;
}> = ({ source, onRename, onView, onSendToChat, onRemove, lang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const menuButtonClass = "w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-[var(--text-primary)] hover:bg-[var(--bg-element-hover)] rounded-md";

    const canSendToChat = source.type !== 'transcription' && typeof source.content === 'string';

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(p => !p); }} 
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-subtle)] backdrop-blur-md border border-[var(--border-color)] rounded-lg shadow-xl p-2 z-10">
                    <button onClick={() => { onView(); setIsOpen(false); }} className={menuButtonClass}>
                        <ScanTextIcon className="w-4 h-4" /> <span>{t('view', lang)}</span>
                    </button>
                    <button onClick={() => { onRename(); setIsOpen(false); }} className={menuButtonClass}>
                        <EditIcon className="w-4 h-4" /> <span>{t('rename', lang)}</span>
                    </button>
                    {canSendToChat && <button onClick={() => { onSendToChat(); setIsOpen(false); }} className={menuButtonClass}>
                        <SendIcon className="w-4 h-4" /> <span>{t('sendToChat', lang)}</span>
                    </button>}
                    <div className="my-1 h-px bg-[var(--border-color)]"></div>
                    <button onClick={() => { onRemove(); setIsOpen(false); }} className={`${menuButtonClass} text-red-500`}>
                        <TrashIcon className="w-4 h-4" /> <span>{t('removeSource', lang)}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  isOpen,
  sources,
  selectedSourceIds,
  onAddSource,
  onRemoveSource,
  onToggleSelection,
  onRename,
  onView,
  onSendToChat,
  lang,
}) => {
  const asideClasses = `
    relative z-10 overflow-hidden flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col
    transition-all duration-300 ease-in-out
    ${isOpen ? 'w-80' : 'w-0'}`;

  return (
    <aside className={asideClasses} style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', paddingLeft: isOpen ? '' : '0', paddingRight: isOpen ? '' : '0' }}>
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
          <div key={source.id} className={`group bg-[var(--bg-element)] p-2 rounded-lg flex justify-between items-center gap-2 ${selectedSourceIds.includes(source.id) ? 'ring-2 ring-[var(--accent-primary)]' : ''}`}>
            <div className="flex items-center gap-3 min-w-0 flex-grow cursor-pointer" onClick={() => onToggleSelection(source.id)}>
                <input 
                    type="checkbox" 
                    checked={selectedSourceIds.includes(source.id)} 
                    readOnly
                    className="flex-shrink-0 accent-[var(--accent-primary)] pointer-events-none"
                />
                <SourceIcon type={source.type} />
                <div className="truncate">
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate" title={source.name}>{source.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{t(`sourceType${source.type.charAt(0).toUpperCase() + source.type.slice(1)}` as any, lang)}</p>
                </div>
            </div>
            <SourceItemMenu 
                source={source}
                onRename={() => onRename(source)}
                onView={() => onView(source)}
                onSendToChat={() => onSendToChat(source.id)}
                onRemove={() => onRemoveSource(source.id)}
                lang={lang}
            />
          </div>
        ))}
      </div>
    </aside>
  );
};
