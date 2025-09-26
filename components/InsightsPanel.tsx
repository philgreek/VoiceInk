


import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, TextStyle, AIAgentExpertise, AIAgentDomain, InsightsSectionState, Source, Message } from '../types';
import { t, Language } from '../utils/translations';
import { XIcon, LightbulbIcon, FileTextIcon, ListChecksIcon, TagsIcon, EditIcon, EllipsisVerticalIcon, ClipboardIcon, DownloadIcon, NotebookIcon, RefreshCwIcon, UsersIcon, SendIcon, ScanTextIcon, MaximizeIcon, MinimizeIcon, ChevronDownIcon, TrashIcon, BookPlusIcon } from './icons';

interface InsightsPanelProps {
  isOpen: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onGenerateSummary: () => void;
  onExtractActionItems: () => void;
  onExtractTopics: () => void;
  analysisResult: AnalysisResult | null;
  isProcessing: { summary: boolean; actionItems: boolean; topics: boolean; proofread: boolean, agent: boolean, entities: boolean };
  isSessionLoaded: boolean;
  lang: Language;
  selectedAIAgents: { expertise: AIAgentExpertise[], domains: AIAgentDomain[] };
  onShowAgentConfig: () => void;
  onExtractEntities: () => void;
  sectionState: InsightsSectionState;
  onToggleSection: (section: keyof InsightsSectionState) => void;
  onConvertToSource: (name: string, content: string) => void;
  onClearAnalysis: () => void;
  activeSection: keyof AnalysisResult | null;
}

const textStyles: TextStyle[] = [
    'default', 'meeting', 'lecture', 'dialogue', 'interview', 'consultation', 
    'podcast', 'blog', 'business', 'literary', 'psychological', 'legal', 'scientific'
];

const LoadingSpinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin"></div>
);

const ExportMenu: React.FC<{ 
    onExport: (format: 'copy' | 'txt' | 'notebooklm' | 'source') => void, 
    onConvertToSource: () => void,
    lang: Language, 
    title: string 
}> = ({ onExport, onConvertToSource, lang, title }) => {
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

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(prev => !prev); }} 
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)] rounded-full"
                title={title}
            >
                <EllipsisVerticalIcon className="w-5 h-5"/>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-subtle)] backdrop-blur-md border border-[var(--border-color)] rounded-lg shadow-xl p-2 z-10">
                    <button onClick={() => { onExport('copy'); setIsOpen(false); }} className={menuButtonClass}>
                        <ClipboardIcon className="w-4 h-4" />
                        <span>{t('copyToClipboard', lang)}</span>
                    </button>
                     <button onClick={() => { onExport('txt'); setIsOpen(false); }} className={menuButtonClass}>
                        <DownloadIcon className="w-4 h-4" />
                        <span>{t('saveAsTxt', lang)}</span>
                    </button>
                    <button onClick={() => { onExport('notebooklm'); setIsOpen(false); }} className={menuButtonClass}>
                        <NotebookIcon className="w-4 h-4" />
                         <span>{t('exportForNotebookLM', lang)}</span>
                    </button>
                    <button onClick={() => { onConvertToSource(); setIsOpen(false); }} className={menuButtonClass}>
                        <BookPlusIcon className="w-4 h-4" />
                         <span>{t('createSource', lang)}</span>
                    </button>
                </div>
            )}
        </div>
    );
};


const CollapsibleSection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    actions?: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    isActive: boolean;
}> = ({ title, icon, children, actions, isExpanded, onToggle, isActive }) => (
    <div className={`border-b border-[var(--border-color)] pb-4 transition-all ${isActive ? 'bg-[var(--bg-element-hover)] rounded-lg' : ''}`}>
        <button onClick={onToggle} className="w-full flex justify-between items-center py-2 px-2">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                {icon}
                <span>{title}</span>
            </h3>
            <div className="flex items-center gap-2">
              {actions}
              <ChevronDownIcon className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
             <div className="text-[var(--text-secondary)] space-y-2 pl-1 border-l-2 border-[var(--border-color)] ml-2">
                {children}
            </div>
        </div>
    </div>
);

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  isOpen, isExpanded, onToggleExpand, onClose, onGenerateSummary, onExtractActionItems, onExtractTopics,
  analysisResult, isProcessing, isSessionLoaded, lang,
  selectedAIAgents, onShowAgentConfig,
  onExtractEntities,
  sectionState, onToggleSection,
  onConvertToSource, onClearAnalysis, activeSection
}) => {
  const [selectedStyle, setSelectedStyle] = useState<TextStyle>('default');
  
  const hasAnyAnalysis = analysisResult && (analysisResult.summary || (analysisResult.actionItems && analysisResult.actionItems.length > 0) || (analysisResult.keyTopics && analysisResult.keyTopics.length > 0) || analysisResult.styledText || (analysisResult.aiChatHistory && analysisResult.aiChatHistory.length > 0));

  const handleExport = (type: keyof AnalysisResult, format: 'copy' | 'txt' | 'notebooklm' | 'source') => {
      let content = '';
      let name = type;
      if (type === 'summary') content = analysisResult?.summary || '';
      else if (type === 'actionItems') content = analysisResult?.actionItems?.map(item => `- ${item.task}`).join('\n') || '';
      else if (type === 'keyTopics') content = analysisResult?.keyTopics?.join(', ') || '';
      else if (type === 'styledText') content = analysisResult?.styledText?.text || '';
      else if (type === 'aiChatHistory') content = analysisResult?.aiChatHistory?.map(m => `${m.role}: ${m.parts[0].text}`).join('\n\n') || '';

      if (format === 'source') {
        onConvertToSource(t('sourceFrom', lang, { type: t(name as any, lang) }), content);
        return;
      }
      // Implement other export formats (copy, txt, etc.)
  };
  
  const asideClasses = `
    flex-shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-color)] flex flex-col
    transition-all duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    ${isExpanded 
        ? 'fixed inset-0 w-full h-full z-40' 
        : 'relative w-80 h-screen'
    }
  `;

  if (!isOpen) return null;

  return (
    <aside className={asideClasses}>
      <header 
        className="p-4 flex justify-between items-center border-b border-[var(--border-color)] flex-shrink-0 cursor-pointer"
        onClick={onToggleExpand}
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
            <LightbulbIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <span>{t('insights', lang)}</span>
        </h2>
        <div className="flex items-center gap-2">
            {hasAnyAnalysis && (
                 <button onClick={(e) => { e.stopPropagation(); if (window.confirm(t('clearInsightsConfirmation', lang))) onClearAnalysis(); }} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-element-hover)] hover:text-red-500" title={t('clearAllInsights', lang)}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            )}
            <button className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-element-hover)] hover:text-[var(--text-primary)]" title={isExpanded ? t('collapse', lang) : t('expand', lang)}>
              {isExpanded ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-element-hover)] hover:text-[var(--text-primary)]">
              <XIcon className="w-5 h-5" />
            </button>
        </div>
      </header>
      
      <div className="p-4 flex-grow overflow-y-auto space-y-4">
        {!isSessionLoaded ? (
            <div className="text-center text-sm text-[var(--text-secondary)] p-4 bg-[var(--bg-subtle)] rounded-lg">
                <p>{t('insightsDescription', lang)}</p>
            </div>
        ) : (
            <>
                <CollapsibleSection 
                    title={t('summary', lang)} 
                    icon={<FileTextIcon className="w-5 h-5"/>}
                    isExpanded={sectionState.summary}
                    onToggle={() => onToggleSection('summary')}
                    actions={analysisResult?.summary && <ExportMenu onExport={(format) => handleExport('summary', format)} onConvertToSource={() => handleExport('summary', 'source')} lang={lang} title={t('exportAnalysis', lang)} />}
                    isActive={activeSection === 'summary'}
                >
                    {analysisResult?.summary ? (
                        <p className="px-3 py-2 text-sm whitespace-pre-wrap">{analysisResult.summary}</p>
                    ) : (
                        <button onClick={onGenerateSummary} disabled={isProcessing.summary} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                            {isProcessing.summary ? <><LoadingSpinner /> {t('generatingSummary', lang)}</> : t('generateSummary', lang)}
                        </button>
                    )}
                </CollapsibleSection>
                
                <CollapsibleSection 
                    title={t('actionItems', lang)} 
                    icon={<ListChecksIcon className="w-5 h-5"/>}
                    isExpanded={sectionState.actionItems}
                    onToggle={() => onToggleSection('actionItems')}
                    actions={analysisResult?.actionItems && analysisResult.actionItems.length > 0 && <ExportMenu onExport={(format) => handleExport('actionItems', format)} onConvertToSource={() => handleExport('actionItems', 'source')} lang={lang} title={t('exportAnalysis', lang)} />}
                    isActive={activeSection === 'actionItems'}
                >
                    {analysisResult?.actionItems && analysisResult.actionItems.length > 0 ? (
                        <ul className="px-3 py-2 text-sm space-y-2">
                           {analysisResult.actionItems.map((item, index) => (
                               <li key={index} className="flex items-start gap-2">
                                   <input type="checkbox" className="mt-1 accent-[var(--accent-primary)]"/>
                                   <span>{item.task}</span>
                               </li>
                           ))}
                        </ul>
                    ) : analysisResult?.actionItems && analysisResult.actionItems.length === 0 ? (
                        <p className="px-3 py-2 text-sm italic">{t('noActionItemsFound', lang)}</p>
                    ) : (
                         <button onClick={onExtractActionItems} disabled={isProcessing.actionItems} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                            {isProcessing.actionItems ? <><LoadingSpinner /> {t('extractingActionItems', lang)}</> : t('extractActionItems', lang)}
                        </button>
                    )}
                </CollapsibleSection>
                
                 <CollapsibleSection 
                    title={t('keyTopics', lang)} 
                    icon={<TagsIcon className="w-5 h-5"/>}
                    isExpanded={sectionState.keyTopics}
                    onToggle={() => onToggleSection('keyTopics')}
                    actions={analysisResult?.keyTopics && analysisResult.keyTopics.length > 0 && <ExportMenu onExport={(format) => handleExport('keyTopics', format)} onConvertToSource={() => handleExport('keyTopics', 'source')} lang={lang} title={t('exportAnalysis', lang)} />}
                    isActive={activeSection === 'keyTopics'}
                >
                    {analysisResult?.keyTopics && analysisResult.keyTopics.length > 0 ? (
                        <div className="px-3 py-2 flex flex-wrap gap-2">
                           {analysisResult.keyTopics.map((topic, index) => (
                               <span key={index} className="text-xs bg-[var(--bg-element)] text-[var(--text-primary)] px-2 py-1 rounded-full">{topic}</span>
                           ))}
                        </div>
                    ) : analysisResult?.keyTopics && analysisResult.keyTopics.length === 0 ? (
                         <p className="px-3 py-2 text-sm italic">{t('noKeyTopicsFound', lang)}</p>
                    ) : (
                        <button onClick={onExtractTopics} disabled={isProcessing.topics} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                            {isProcessing.topics ? <><LoadingSpinner /> {t('extractingKeyTopics', lang)}</> : t('extractKeyTopics', lang)}
                        </button>
                    )}
                </CollapsibleSection>

                <CollapsibleSection 
                    title={t('textAnalysis', lang)} 
                    icon={<ScanTextIcon className="w-5 h-5" />}
                    isExpanded={sectionState.textAnalysis}
                    onToggle={() => onToggleSection('textAnalysis')}
                    isActive={activeSection === 'entities'}
                >
                     <div className="px-3 py-2">
                        {analysisResult?.entities && analysisResult.entities.length > 0 ? (
                            <p className="text-sm italic">{analysisResult.entities.length} entities found and highlighted in the chat.</p>
                        ) : (
                           <button onClick={onExtractEntities} disabled={isProcessing.entities} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                                {isProcessing.entities ? <><LoadingSpinner /> {t('findingEntities', lang)}</> : t('findEntities', lang)}
                            </button>
                        )}
                    </div>
                </CollapsibleSection>
                
                <CollapsibleSection 
                    title={t('aiChat', lang)} 
                    icon={<UsersIcon className="w-5 h-5" />}
                    isExpanded={sectionState.aiChat}
                    onToggle={() => onToggleSection('aiChat')}
                    isActive={activeSection === 'aiChatHistory'}
                >
                   <div className="px-3 py-2 space-y-2">
                        <button onClick={onShowAgentConfig} className="w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors text-sm">
                           {t('configureAgent', lang)}
                        </button>
                    </div>
                </CollapsibleSection>
            </>
        )}
      </div>
    </aside>
  );
};