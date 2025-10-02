
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session, Source } from '../types';
import { t, Language } from '../utils/translations';
import { PanelLeftCloseIcon, PanelLeftIcon, PlusCircleIcon, SearchIcon, FileIcon, LinkIcon, FileAudioIcon, MaximizeIcon, ArrowLeftIcon, SparklesDiamondIcon, ChevronUpIcon, EllipsisVerticalIcon, EditIcon, TrashIcon } from './icons';
import { InsightRenderer } from './InsightRenderer';

interface SourcesPanelProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    session: Session;
    onToggleSource: (id: string) => void;
    onToggleSelectAll: () => void;
    onAddSourceClick: () => void;
    onSearchClick: () => void;
    onRenameSource: (source: Source) => void;
    onDeleteSource: (sourceId: string) => void;
    onGenerateGuide: (sourceId: string) => void;
    isProcessingGuide: boolean;
    onStartDiscussion: (topic: string) => void;
    onClearHighlight: () => void;
    lang: Language;
    isProcessingDiscussion: boolean;
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
    onStartDiscussion: (topic: string) => void;
    isProcessingDiscussion: boolean;
    lang: Language;
}> = ({ source, isProcessing, onStartDiscussion, isProcessingDiscussion, lang }) => {
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
                    <div className="flex flex-wrap gap-2">
                        {(source.guide.keyTopics || []).map((topic, i) => (
                            <button 
                                key={i} 
                                onClick={() => onStartDiscussion(topic)}
                                disabled={isProcessingDiscussion}
                                className="text-xs p-1.5 px-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-full text-slate-300 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {topic}
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
    onStartDiscussion: (topic: string) => void;
    session: Session;
    onClearHighlight: () => void;
    lang: Language;
    isProcessingDiscussion: boolean;
}> = ({ source, onBack, onGenerateGuide, isProcessingGuide, onStartDiscussion, session, onClearHighlight, lang, isProcessingDiscussion }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { highlightFragment, insights, isInsightModeActive } = session;

    useEffect(() => {
        if (!source.guide) {
            onGenerateGuide(source.id);
        }
    }, [source, onGenerateGuide]);

    useEffect(() => {
        const contentEl = contentRef.current;
        if (!contentEl) return;

        // Function to remove existing highlights
        const clearHighlights = () => {
            const marks = contentEl.querySelectorAll('mark');
            marks.forEach(mark => {
                const parent = mark.parentNode;
                if(parent) {
                    while (mark.firstChild) {
                        parent.insertBefore(mark.firstChild, mark);
                    }
                    parent.removeChild(mark);
                    parent.normalize(); // Merges adjacent text nodes
                }
            });
        };
        
        clearHighlights();

        if (highlightFragment && highlightFragment.sourceId === source.id) {
            const fragmentText = highlightFragment.fragment;
            const treeWalker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
            let currentNode;
            while (currentNode = treeWalker.nextNode()) {
                const nodeText = currentNode.nodeValue || '';
                const startIndex = nodeText.indexOf(fragmentText);
                if (startIndex !== -1) {
                    const range = document.createRange();
                    range.setStart(currentNode, startIndex);
                    range.setEnd(currentNode, startIndex + fragmentText.length);
                    const mark = document.createElement('mark');
                    mark.className = 'bg-yellow-400 text-black rounded';
                    range.surroundContents(mark);
                    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break; 
                }
            }
        }
        
    }, [highlightFragment, source.id]);


    const content = Array.isArray(source.content)
        ? source.content.map(m => `${m.sender}: ${m.text}`).join('\n')
        : source.content;

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex justify-between items-center border-b border-[var(--border-color)] flex-shrink-0 h-[89px]">
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
                <SourceGuideViewer source={source} isProcessing={isProcessingGuide} onStartDiscussion={onStartDiscussion} isProcessingDiscussion={isProcessingDiscussion} lang={lang} />
                <div 
                    ref={contentRef}
                    className="text-sm text-slate-300 whitespace-pre-wrap prose prose-invert prose-sm max-w-none"
                >
                    <InsightRenderer text={content} insights={insights || []} isInsightModeActive={isInsightModeActive || false} lang={lang} />
                </div>
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
         <div className="group w-full flex items-center gap-3 p-2 rounded-md hover:bg-[var(--bg-element-hover)] text-left relative">
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
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-600 flex-shrink-0"
            />
        </div>
    );
}


export const SourcesPanel: React.FC<SourcesPanelProps> = ({
    isCollapsed,
    onToggleCollapse,
    session,
    onToggleSource,
    onToggleSelectAll,
    onAddSourceClick,
    onSearchClick,
    onGenerateGuide,
    isProcessingGuide,
    onRenameSource,
    onDeleteSource,
    onStartDiscussion,
    onClearHighlight,
    lang,
    isProcessingDiscussion,
}) => {
    const { sources, selectedSourceIds = [], highlightFragment } = session;
    const [viewingSourceId, setViewingSourceId] = useState<string | null>(null);

    useEffect(() => {
        if (highlightFragment) {
            setViewingSourceId(highlightFragment.sourceId);
        }
    }, [highlightFragment]);

    const allSourcesSelected = sources.length > 0 && selectedSourceIds.length === sources.length;
    const viewingSource = sources.find(s => s.id === viewingSourceId);

    const asideClasses = `
        flex-shrink-0 bg-[var(--bg-surface)] rounded-lg shadow-md flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16 basis-16' : (viewingSource ? 'w-[40vw] max-w-xl basis-[40vw]' : 'w-80 basis-80')}`;

    if (isCollapsed) {
        return (
            <aside className={asideClasses}>
                <header className="p-4 flex justify-center items-center border-b border-[var(--border-color)] flex-shrink-0 h-[60px]">
                    <button
                        onClick={onToggleCollapse}
                        className="p-2 text-slate-400 hover:text-white hover:bg-[var(--bg-element-hover)] rounded-full"
                        title={t('expandPanel', lang)}
                    >
                        <PanelLeftIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-2 space-y-2">
                    <button onClick={onAddSourceClick} className="w-full aspect-square bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg flex items-center justify-center" title={t('addSourceTitle', lang)}>
                        <PlusCircleIcon className="w-6 h-6 text-slate-300" />
                    </button>
                    <button onClick={onSearchClick} className="w-full aspect-square bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg flex items-center justify-center" title={t('find', lang)}>
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
                    onBack={() => { setViewingSourceId(null); onClearHighlight(); }}
                    onGenerateGuide={onGenerateGuide}
                    isProcessingGuide={isProcessingGuide}
                    onStartDiscussion={onStartDiscussion}
                    session={session}
                    onClearHighlight={onClearHighlight}
                    lang={lang}
                    isProcessingDiscussion={isProcessingDiscussion}
                />
            </aside>
        );
    }

    return (
        <aside className={asideClasses}>
            <header className="p-4 flex justify-between items-center border-b border-[var(--border-color)] flex-shrink-0 h-[60px]">
                <h2 className="text-xl font-bold text-slate-100">{t('sources', lang)}</h2>
                <button
                    onClick={onToggleCollapse}
                    className="p-2 text-slate-400 hover:text-white hover:bg-[var(--bg-element-hover)] rounded-full"
                    title={t('collapsePanel', lang)}
                >
                    <PanelLeftCloseIcon className="w-6 h-6" />
                </button>
            </header>
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <button onClick={onAddSourceClick} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors text-sm font-semibold">
                        <PlusCircleIcon className="w-4 h-4" />
                        {t('add', lang)}
                    </button>
                    <button onClick={onSearchClick} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors text-sm font-semibold">
                        <SearchIcon className="w-4 h-4" />
                        {t('find', lang)}
                    </button>
                </div>
                <div className="border-t border-[var(--border-color)]"></div>
                <div className="flex items-center justify-between">
                    <label htmlFor="select-all-sources" className="text-sm text-slate-400 select-none cursor-pointer">
                        {t('selectAllSources', lang)}
                    </label>
                    <input
                        type="checkbox"
                        id="select-all-sources"
                        checked={allSourcesSelected}
                        onChange={onToggleSelectAll}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-600"
                    />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto px-2 space-y-1">
                {sources.map(source => (
                    <SourceItem 
                        key={source.id}
                        source={source}
                        isSelected={selectedSourceIds.includes(source.id)}
                        onView={(id) => { setViewingSourceId(id); onClearHighlight(); }}
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
