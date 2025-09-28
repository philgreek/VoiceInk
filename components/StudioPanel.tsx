import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Note, SessionProfileId, StudioToolId, Session, ToolSettings, TextStyleId } from '../types';
import { t, Language } from '../utils/translations';
import { XIcon, EllipsisVerticalIcon, PanelRightCloseIcon, PanelRightIcon, FileTextIcon, PlusCircleIcon, FlashcardsIcon, MindMapIcon, PlusIcon, PencilPlusIcon, EditIcon, LayersIcon, FileExportIcon, TrashIcon, SparklesIcon, FileAudioIcon, MaximizeIcon, ArrowLeftIcon, UndoIcon, RedoIcon, BoldIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon, RemoveFormattingIcon, EmotionAnalysisIcon, TonalityAnalysisIcon } from './icons';
import { studioTools, textStyles } from '../utils/profiles';

interface StudioPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isSessionLoaded: boolean;
  lang: Language;
  session: Session;
  notes: Note[];
  onDeleteNote: (noteId: string) => void;
  onRenameNote: (noteId: string, newTitle: string) => void;
  onConvertToSource: (noteId: string) => void;
  onConvertAllNotesToSource: () => void;
  onAddNewNote: () => string;
  onUpdateNoteContent: (noteId: string, newContent: string) => void;
  onConfigureToolsClick: () => void;
  onTriggerTool: (toolId: StudioToolId) => void;
  processingTool: StudioToolId | null;
  toolSettings?: ToolSettings;
  onUpdateToolSettings: (toolId: StudioToolId, settings: any) => void;
}

const ToolCard: React.FC<{ 
    toolId: StudioToolId, 
    onClick: () => void, 
    lang: Language,
    isLoading: boolean,
    settings?: any;
    onUpdateSettings: (settings: any) => void;
}> = ({ toolId, onClick, lang, isLoading, settings, onUpdateSettings }) => {
    const tool = studioTools[toolId];
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!tool) return null;

    const handleSettingsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSettingsOpen(p => !p);
    };

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                disabled={isLoading}
                className="w-full h-full p-3 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors flex flex-col items-start justify-between text-left gap-2 disabled:cursor-wait disabled:bg-slate-700/80"
            >
                <div className="flex justify-between items-start w-full">
                  <tool.icon className="w-5 h-5 text-slate-300" />
                  {isLoading && <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <span className="text-sm font-semibold text-slate-200">{t(tool.nameKey, lang)}</span>
            </button>

            {tool.isConfigurable && (
                 <div ref={settingsRef}>
                    <button 
                        onClick={handleSettingsClick}
                        className="absolute top-2 right-2 p-1 bg-black/20 hover:bg-black/40 rounded-full text-slate-400 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    {isSettingsOpen && tool.id === 'textStyle' && (
                        <div className="absolute top-full mt-1 right-0 z-10 bg-slate-900 border border-slate-700 rounded-md shadow-lg py-1 w-48">
                            {textStyles.map(style => (
                                <button 
                                    key={style.id} 
                                    onClick={() => {
                                        onUpdateSettings({ style: style.id });
                                        setIsSettingsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-sm  hover:bg-slate-800 ${settings?.style === style.id ? 'text-cyan-400' : 'text-slate-200'}`}
                                >
                                    {t(style.nameKey, lang)}
                                </button>
                            ))}
                        </div>
                    )}
                 </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute top-full mt-2 left-0 w-full p-3 bg-slate-900 text-white text-xs rounded-md shadow-lg z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 invisible group-hover:visible">
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                 <h4 className="font-bold text-sm mb-1 text-slate-100">{t(tool.nameKey, lang)}</h4>
                 <p className="text-slate-300">{t(tool.descriptionKey, lang)}</p>
            </div>
        </div>
    );
};

const NoteIcon: React.FC<{note: Note}> = ({note}) => {
    if (note.icon) {
        const Icon = note.icon;
        return <Icon className="w-5 h-5 text-slate-400" />;
    }
    switch (note.type) {
        case 'summary': return <FileTextIcon className="w-5 h-5 text-slate-400" />;
        case 'flashcards': return <FlashcardsIcon className="w-5 h-5 text-slate-400" />;
        case 'mindMap': return <MindMapIcon className="w-5 h-5 text-slate-400" />;
        case 'transcription': return <FileAudioIcon className="w-5 h-5 text-cyan-400" />;
        case 'assistantResponse': return <SparklesIcon className="w-5 h-5 text-purple-400" />;
        case 'emotionAnalysis': return <EmotionAnalysisIcon className="w-5 h-5 text-pink-400" />;
        case 'tonalityAnalysis': return <TonalityAnalysisIcon className="w-5 h-5 text-amber-400" />;
        default: return <FileTextIcon className="w-5 h-5 text-slate-400" />;
    }
}

const NoteItem: React.FC<{
    note: Note;
    lang: Language;
    onView: (id: string) => void;
    onDelete: (id: string) => void;
    onConvertToSource: (id: string) => void;
    onConvertAllNotesToSource: () => void;
}> = ({ note, lang, onView, onDelete, onConvertToSource, onConvertAllNotesToSource }) => {
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

    const timeAgo = (isoDate: string) => {
        const date = new Date(isoDate);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " " + t('daysAgo', lang);
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " " + t('hoursAgo', lang);
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " " + t('minutesAgo', lang);
        return Math.floor(seconds) + " " + t('secondsAgo', lang);
    }

    return (
        <div 
            className="group flex items-center justify-between p-2 rounded-md hover:bg-slate-800/60 cursor-pointer"
            onClick={() => onView(note.id)}
        >
            <div className="flex items-center gap-3 min-w-0">
                <NoteIcon note={note} />
                <div className="truncate">
                    <p className="text-sm font-medium text-slate-200 truncate">{note.title}</p>
                    <p className="text-xs text-slate-500">{timeAgo(note.time)}</p>
                </div>
            </div>
            <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
                 <button onClick={() => setIsMenuOpen(p => !p)} className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100">
                    <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                     <div className="absolute right-0 top-full mt-1 z-10 bg-slate-900 border border-slate-700 rounded-md shadow-lg py-2 w-60">
                        <button onClick={() => { onConvertToSource(note.id); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2">
                            <FileExportIcon className="w-4 h-4"/> {t('convertToSource', lang)}
                        </button>
                         <button onClick={() => { onConvertAllNotesToSource(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2">
                            <LayersIcon className="w-4 h-4"/> {t('convertAllNotesToSource', lang)}
                        </button>
                        <div className="my-1 h-px bg-slate-700"></div>
                        <button onClick={() => { onDelete(note.id); setIsMenuOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                            <TrashIcon className="w-4 h-4"/> {t('deleteNote', lang)}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const NoteEditorToolbar: React.FC<{ lang: Language }> = ({ lang }) => {
    const execCmd = (command: string, value?: string) => document.execCommand(command, false, value);

    const buttonClass = "p-2 rounded text-slate-300 hover:bg-slate-700 hover:text-white";
    
    return (
        <div className="flex items-center gap-1 p-1 bg-slate-800/70 border border-slate-700 rounded-md">
            <button onClick={() => execCmd('undo')} className={buttonClass} title={t('undo', lang)}><UndoIcon className="w-4 h-4" /></button>
            <button onClick={() => execCmd('redo')} className={buttonClass} title={t('redo', lang)}><RedoIcon className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-slate-700 mx-1"></div>
            <button onClick={() => execCmd('bold')} className={buttonClass} title={t('bold', lang)}><BoldIcon className="w-4 h-4" /></button>
            <button onClick={() => execCmd('italic')} className={buttonClass} title={t('italic', lang)}><ItalicIcon className="w-4 h-4" /></button>
            <button onClick={() => {
                const url = prompt('Enter the URL');
                if (url) execCmd('createLink', url);
            }} className={buttonClass} title={t('link', lang)}><LinkIcon className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-slate-700 mx-1"></div>
            <button onClick={() => execCmd('insertUnorderedList')} className={buttonClass} title={t('bulletList', lang)}><ListIcon className="w-4 h-4" /></button>
            <button onClick={() => execCmd('insertOrderedList')} className={buttonClass} title={t('orderedList', lang)}><ListOrderedIcon className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-slate-700 mx-1"></div>
            <button onClick={() => execCmd('removeFormat')} className={buttonClass} title={t('removeFormat', lang)}><RemoveFormattingIcon className="w-4 h-4" /></button>
        </div>
    );
};

const NoteDetailView: React.FC<{
    note: Note;
    onBack: () => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
    onConvertToSource: (id: string) => void;
    onUpdateContent: (id: string, newContent: string) => void;
    lang: Language;
}> = ({ note, onBack, onRename, onDelete, onConvertToSource, onUpdateContent, lang }) => {
    const [title, setTitle] = useState(note.title);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTitle(note.title);
        if (contentRef.current && contentRef.current.innerHTML !== note.content) {
            contentRef.current.innerHTML = note.content;
        }
    }, [note]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleTitleBlur = () => {
        if (title.trim() && title.trim() !== note.title) {
            onRename(note.id, title.trim());
        } else {
            setTitle(note.title); // revert if empty or unchanged
        }
    };
    
    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleDelete = () => {
        onDelete(note.id);
        onBack(); // Go back to the list after deleting
    };
    
    const handleConvertToSourceClick = () => {
        onConvertToSource(note.id);
        onBack(); // Go back to the list after converting
    };

    const handleContentBlur = () => {
        if (contentRef.current) {
            onUpdateContent(note.id, contentRef.current.innerHTML);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex justify-between items-center border-b border-slate-800 flex-shrink-0 h-[89px]">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-400">
                    <button className="hover:text-white" onClick={onBack}>{t('studio', lang)}</button>
                    <span>&gt;</span>
                    <span className="text-slate-200">{t('note', lang)}</span>
                </div>
                <button
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full"
                    title={t('expand', lang)}
                >
                    <MaximizeIcon className="w-6 h-6" />
                </button>
            </header>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                <div className="relative">
                    <input 
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="w-full bg-transparent border border-slate-700 rounded-md p-3 pr-10 text-lg font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button onClick={handleDelete} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
                
                <NoteEditorToolbar lang={lang} />
                
                <div
                    ref={contentRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleContentBlur}
                    className="text-sm text-slate-300 whitespace-pre-wrap min-h-[200px] p-2 border border-transparent focus:outline-none focus:border-slate-600 rounded-md"
                    dangerouslySetInnerHTML={{ __html: note.content || '<p><br></p>' }}
                />
            </div>
            <div className="p-4 border-t border-slate-800 flex-shrink-0">
                <button onClick={handleConvertToSourceClick} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-md transition-colors">
                    <FileExportIcon className="w-5 h-5" />
                    <span>{t('convertToSource', lang)}</span>
                </button>
            </div>
        </div>
    );
};


export const StudioPanel: React.FC<StudioPanelProps> = (props) => {
  const { isCollapsed, onToggleCollapse, session, lang, notes, onDeleteNote, onRenameNote, onConvertToSource, onConvertAllNotesToSource, onAddNewNote, onUpdateNoteContent, onConfigureToolsClick, onTriggerTool, processingTool, toolSettings, onUpdateToolSettings } = props;
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);

  const viewingNote = notes.find(n => n.id === viewingNoteId);
  const activeTools = session.activeTools || [];
  
  const uniqueGeneratedNoteTypes = useMemo(() => {
    return [...new Set(notes.map(n => n.type))];
  }, [notes]);

  const handleAddNoteClick = () => {
    const newNoteId = onAddNewNote();
    setViewingNoteId(newNoteId);
  };
  
  const asideClasses = `
    relative z-20 flex-shrink-0 bg-slate-950 backdrop-blur-sm border-l border-slate-800 flex flex-col
    transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-16' : (viewingNote ? 'w-[50vw] max-w-2xl' : 'w-80')}`;

  return (
    <aside className={asideClasses}>
        {viewingNote ? (
            <NoteDetailView
                note={viewingNote}
                onBack={() => setViewingNoteId(null)}
                onRename={onRenameNote}
                onDelete={onDeleteNote}
                onConvertToSource={onConvertToSource}
                onUpdateContent={onUpdateNoteContent}
                lang={lang}
            />
        ) : (
            <div className="flex flex-col h-full">
                <header className="p-4 flex justify-between items-center border-b border-slate-800 flex-shrink-0 h-[89px]">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                         <h2 className="text-xl font-bold text-slate-100">{t('studio', lang)}</h2>
                         <button onClick={onConfigureToolsClick} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/50" title={t('configureTools', lang)}>
                             <EditIcon className="w-4 h-4"/>
                         </button>
                    </div>
                )}
                <div className={`${isCollapsed ? 'w-full flex justify-center' : ''}`}>
                    <button
                    onClick={onToggleCollapse}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full"
                    title={isCollapsed ? t('expandPanel', lang) : t('collapsePanel', lang)}
                    >
                    {isCollapsed ? <PanelRightIcon className="w-6 h-6" /> : <PanelRightCloseIcon className="w-6 h-6" />}
                    </button>
                </div>
                </header>

                {isCollapsed ? (
                    <div className="flex-grow flex flex-col items-center justify-between p-2">
                        <div className="w-full space-y-2">
                            {activeTools.map(toolId => {
                                const tool = studioTools[toolId];
                                if (!tool) return null;
                                return (
                                <button key={toolId} onClick={() => onTriggerTool(toolId)} className="w-full aspect-square relative group bg-slate-800/50 hover:bg-slate-700/80 rounded-lg flex items-center justify-center" title={t(tool.nameKey, lang)}>
                                    <tool.icon className="w-6 h-6 text-slate-300" />
                                    <div className="absolute bottom-1 right-1 bg-slate-600 rounded-full p-0.5">
                                        <PlusIcon className="w-2 h-2 text-slate-200" />
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                        
                        <div className="w-full space-y-3">
                            {uniqueGeneratedNoteTypes.map(type => {
                                const note = notes.find(n => n.type === type);
                                if (!note) return null;
                                return (
                                    <div key={type} className="w-full flex justify-center" title={note.title}>
                                        <NoteIcon note={note} />
                                    </div>
                                );
                            })}
                        </div>

                        <div className="w-full mt-4">
                            <button onClick={handleAddNoteClick} className="w-10 h-10 mx-auto bg-slate-200 hover:bg-white text-slate-800 font-semibold rounded-full transition-colors flex items-center justify-center" title={t('addNote', lang)}>
                                <PencilPlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                <>
                    <div className="p-4 flex-grow overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            {activeTools.map(toolId => (
                                <ToolCard 
                                    key={toolId} 
                                    toolId={toolId} 
                                    onClick={() => onTriggerTool(toolId)} 
                                    lang={lang}
                                    isLoading={processingTool === toolId}
                                    settings={toolSettings?.[toolId as keyof ToolSettings]}
                                    onUpdateSettings={(newSettings) => onUpdateToolSettings(toolId, newSettings)}
                                />
                            ))}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-800">
                            <h3 className="px-2 mb-2 text-sm font-semibold text-slate-400">{t('generatedNotes', lang)}</h3>
                            <div className="space-y-1">
                                {notes.map(note => (
                                    <NoteItem 
                                        key={note.id}
                                        note={note}
                                        lang={lang}
                                        onView={setViewingNoteId}
                                        onDelete={onDeleteNote}
                                        onConvertToSource={onConvertToSource}
                                        onConvertAllNotesToSource={onConvertAllNotesToSource}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-800">
                        <button onClick={handleAddNoteClick} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-200 hover:bg-white text-slate-800 font-semibold rounded-full transition-colors">
                            <EditIcon className="w-4 h-4" />
                            <span>{t('addNote', lang)}</span>
                        </button>
                    </div>
                </>
                )}
            </div>
        )}
    </aside>
  );
};