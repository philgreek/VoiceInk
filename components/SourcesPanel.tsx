

import React, { useState, useEffect, useRef } from 'react';
import { Source } from '../types';
import { t, Language } from '../utils/translations';
import { PanelLeftCloseIcon, PanelLeftIcon, PlusCircleIcon, SearchIcon, FileIcon, LinkIcon, FileAudioIcon, MaximizeIcon, ArrowLeftIcon, SparklesDiamondIcon, ChevronUpIcon, EllipsisVerticalIcon, EditIcon, TrashIcon } from './icons';

interface SourcesPanelProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    sources: Source[];
    selectedSourceIds: string[];
    onToggleSource: (id: string) => void;
    onToggleSelectAll: () => void;
    onAddSourceClick: () => void;
    onSearchClick: () => void;
    onRenameSource: (source: Source) => void;
    onDeleteSource: (sourceId: string) => void;
    onGenerateGuide: (sourceId: string) => void;
    isProcessingGuide: boolean;
    lang: Language;
}

const SourceIcon: React.FC<{ type: Source['type'] }> = ({ type }) => {
    switch (type) {
        case 'transcription': return <FileAudioIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />;
        case 'audio': return <FileAudioIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />;
        case 'file': return <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />;
        case 'url': return <LinkIcon className="w-5 h-5 text-green-400 flex-shrink-0" />;
        default: return <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />;
    }
};

const SourceGuideViewer: React.FC<{
    source: Source;
    isProcessing: boolean;
    lang: Language;
}> = ({ source, isProcessing, lang }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (isProcessing) {
        return (
            <div className="p-4 bg-slate-800/50 rounded-lg text-slate-300 animate-pulse">
                {t('generatingGuide', lang)}
            </div>
        );
    }
    
    if (!source.guide) return null;

    return (
        <div className="bg-slate-800/50 rounded-lg">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex justify-between items-center p-3 text-left"
            >
                <div className="flex items-center gap-2">
                    <SparklesDiamondIcon className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-slate-200">{t('sourceGuideTitle', lang)}</span>
                </div>
                <ChevronUpIcon className={`w-5 h-5 text-slate-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            {!isCollapsed && (
                <div className="px-3 pb-3 space-y-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{source.guide.summary}</p>
                    <div className="space-y-2">
                        {source.guide.questions.map((q, i) => (
                            <button key={i} className="w-full text-left text-sm p-2 bg-slate-700/50 hover:bg-slate-700 rounded-md text-slate-300">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const SourceDetailView: React.FC<{
    source: Source;
    onBack: () => void;
    onGenerateGuide: (sourceId: string) => void;
    isProcessingGuide: boolean;
    lang: Language;
}> = ({ source, onBack, onGenerateGuide, isProcessingGuide, lang }) => {
    
    useEffect(() => {
        if (!source.guide) {
            onGenerateGuide(source.id);
        }
    }, [source, onGenerateGuide]);

    const content = Array.isArray(source.content)
        ? source.content.map(m => `${m.sender}: ${m.text}`).join('\n')
        : source.content;

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex justify-between items-center border-b border-slate-800 flex-shrink-0 h-[89px]">
                <button
                    onClick={onBack}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full"
                    title={t('backToList', lang)}
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-slate-100 truncate flex-grow text-center px-2" title={source.name}>{source.name}</h2>
                <button
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full"
                    title={t('expand', lang)}
                >
                    <MaximizeIcon className="w-6 h-6" />
                </button>
            </header>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                <SourceGuideViewer source={source} isProcessing={isProcessingGuide} lang={lang} />
                <div 
                    className="text-sm text-slate-300 whitespace-pre-wrap prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
        </div>
    );
};

const SourceItem: React.FC<{
    source: Source;
    isSelected: boolean;
    onView: (id: string) => void;
    onToggle: (id: string) => void;
    onRename: (source: Source) => void;
    onDelete: (id: string) => void;
    lang: Language;
}> = ({ source, isSelected, onView, onToggle, onRename, onDelete, lang }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
         <div className="group w-full flex items-center gap-3 p-2 rounded-md hover:bg-slate-800/60 text-left relative">
            <div ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(p => !p)}
                    className="p-1 text-slate-500 hover:text-white"
                >
                    <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                    <div className="absolute left-2 top-8 z-10 bg-slate-900 border border-slate-700 rounded-md shadow-lg py-2 w-48">
                        <button onClick={() => { onDelete(source.id); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2">
                            <TrashIcon className="w-4 h-4"/> {t('removeSource', lang)}
                        </button>
                        <button onClick={() => { onRename(source); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2">
                            <EditIcon className="w-4 h-4"/> {t('renameSource', lang)}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2 cursor-pointer flex-grow min-w-0" onClick={() => onView(source.id)}>
              <SourceIcon type={source.type} />
              <span className="flex-grow text-sm text-slate-200 truncate" title={source.name}>
                  {source.name}
              </span>
            </div>
            
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(source.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded-none bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-600 flex-shrink-0"
            />
        </div>
    );
}


export const SourcesPanel: React.FC<SourcesPanelProps> = ({
    isCollapsed,
    onToggleCollapse,
    sources,
    selectedSourceIds,
    onToggleSource,
    onToggleSelectAll,
    onAddSourceClick,
    onSearchClick,
    onGenerateGuide,
    isProcessingGuide,
    onRenameSource,
    onDeleteSource,
    lang,
}) => {
    const [viewingSourceId, setViewingSourceId] = useState<string | null>(null);

    const allSourcesSelected = sources.length > 0 && selectedSourceIds.length === sources.length;
    const viewingSource = sources.find(s => s.id === viewingSourceId);

    const asideClasses = `
        flex-shrink-0 bg-slate-950 backdrop-blur-sm border-r border-slate-800 flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : (viewingSource ? 'w-[40vw] max-w-xl' : 'w-80')}`;

    if (isCollapsed) {
        return (
            <aside className={asideClasses}>
                <header className="p-4 flex justify-center items-center border-b border-slate-800 flex-shrink-0 h-[89px]">
                    <button
                        onClick={onToggleCollapse}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full"
                        title={t('expandPanel', lang)}
                    >
                        <PanelLeftIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-2 space-y-2">
                    <button onClick={onAddSourceClick} className="w-full aspect-square bg-slate-800/50 hover:bg-slate-700/80 rounded-lg flex items-center justify-center" title={t('addSource', lang)}>
                        <PlusCircleIcon className="w-6 h-6 text-slate-300" />
                    </button>
                    <button onClick={onSearchClick} className="w-full aspect-square bg-slate-800/50 hover:bg-slate-700/80 rounded-lg flex items-center justify-center" title={t('find', lang)}>
                        <SearchIcon className="w-6 h-6 text-slate-300" />
                    </button>
                </div>
            </aside>
        );
    }
    
    if (viewingSource) {
        return (
            <aside className={asideClasses}>
                <SourceDetailView 
                    source={viewingSource}
                    onBack={() => setViewingSourceId(null)}
                    onGenerateGuide={onGenerateGuide}
                    isProcessingGuide={isProcessingGuide}
                    lang={lang}
                />
            </aside>
        );
    }

    return (
        <aside className={asideClasses}>
            <header className="p-4 flex justify-between items-center border-b border-slate-800 flex-shrink-0 h-[89px]">
                <h2 className="text-xl font-bold text-slate-100">{t('sources', lang)}</h2>
                <button
                    onClick={onToggleCollapse}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full"
                    title={t('collapsePanel', lang)}
                >
                    <PanelLeftCloseIcon className="w-6 h-6" />
                </button>
            </header>
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <button onClick={onAddSourceClick} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors text-sm font-semibold">
                        <PlusCircleIcon className="w-4 h-4" />
                        {t('add', lang)}
                    </button>
                    <button onClick={onSearchClick} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors text-sm font-semibold">
                        <SearchIcon className="w-4 h-4" />
                        {t('find', lang)}
                    </button>
                </div>
                <div className="border-t border-slate-800"></div>
                <div className="flex items-center justify-between">
                    <label htmlFor="select-all-sources" className="text-sm text-slate-400 select-none cursor-pointer">
                        {t('selectAllSources', lang)}
                    </label>
                    <input
                        type="checkbox"
                        id="select-all-sources"
                        checked={allSourcesSelected}
                        onChange={onToggleSelectAll}
                        className="w-4 h-4 rounded-none bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-600"
                    />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto px-2 space-y-1">
                {sources.map(source => (
                    <SourceItem 
                        key={source.id}
                        source={source}
                        isSelected={selectedSourceIds.includes(source.id)}
                        onView={setViewingSourceId}
                        onToggle={onToggleSource}
                        onRename={onRenameSource}
                        onDelete={onDeleteSource}
                        lang={lang}
                    />
                ))}
            </div>
        </aside>
    );
};