

import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, TextStyle, AIAgent, AIChatMessage } from '../types';
// FIX: Import 'translations' to resolve TypeScript errors related to type inference.
import { t, Language, translations } from '../utils/translations';
import { XIcon, LightbulbIcon, FileTextIcon, ListChecksIcon, TagsIcon, EditIcon, EllipsisVerticalIcon, ClipboardIcon, DownloadIcon, NotebookIcon, RefreshCwIcon, UsersIcon, SendIcon, ScanTextIcon } from './icons';

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSummary: () => void;
  onExtractActionItems: () => void;
  onExtractTopics: () => void;
  analysisResult: AnalysisResult | null;
  isProcessing: { summary: boolean; actionItems: boolean; topics: boolean; proofread: boolean, agent: boolean, entities: boolean };
  isSessionLoaded: boolean;
  lang: Language;
  onProofreadAndStyle: () => void;
  selectedStyle: TextStyle;
  onStyleChange: (style: TextStyle) => void;
  onExportAnalysis: (type: 'summary' | 'actionItems' | 'keyTopics', format: 'copy' | 'txt' | 'notebooklm') => void;
  onExportStyledText: (format: 'copy' | 'txt' | 'notebooklm') => void;
  onClearStyledText: () => void;
  onAskAIAgent: (prompt: string) => void;
  aiChatHistory: AIChatMessage[];
  selectedAIAgents: AIAgent[];
  onSelectedAIAgentsChange: (agents: AIAgent[]) => void;
  onExtractEntities: () => void;
}

const textStyles: TextStyle[] = [
    'default', 'meeting', 'lecture', 'dialogue', 'interview', 'consultation', 
    'podcast', 'blog', 'business', 'literary', 'psychological', 'legal', 'scientific'
];

const aiAgents: { id: AIAgent, nameKey: keyof typeof translations.en }[] = [
    { id: 'legal', nameKey: 'agentLegal' },
    { id: 'psychologist', nameKey: 'agentPsychologist' },
    { id: 'coach', nameKey: 'agentCoach' },
    { id: 'editor', nameKey: 'agentEditor' },
    { id: 'financial', nameKey: 'agentFinancial' },
    { id: 'tutor', nameKey: 'agentTutor' },
    { id: 'speechwriter', nameKey: 'agentSpeechwriter' },
];

const LoadingSpinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin"></div>
);

const ExportMenu: React.FC<{ onExport: (format: 'copy' | 'txt' | 'notebooklm') => void, lang: Language, title: string }> = ({ onExport, lang, title }) => {
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
                onClick={() => setIsOpen(prev => !prev)} 
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
                </div>
            )}
        </div>
    );
};


const Section: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    actions?: React.ReactNode;
}> = ({ title, icon, children, actions }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                {icon}
                <span>{title}</span>
            </h3>
            {actions}
        </div>
        <div className="text-[var(--text-secondary)] space-y-2 pl-1 border-l-2 border-[var(--border-color)]">
            {children}
        </div>
    </div>
);

const AgentSelector: React.FC<{
    selectedAgents: AIAgent[];
    onChange: (agents: AIAgent[]) => void;
    lang: Language;
}> = ({ selectedAgents, onChange, lang }) => {
    const handleToggle = (agentId: AIAgent) => {
        const newSelection = selectedAgents.includes(agentId)
            ? selectedAgents.filter(id => id !== agentId)
            : [...selectedAgents, agentId];
        onChange(newSelection);
    };

    return (
        <div className="px-3 py-2 space-y-2">
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">{t('selectAIAgent', lang)}</label>
            <div className="flex flex-wrap gap-2">
                {aiAgents.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => handleToggle(agent.id)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedAgents.includes(agent.id)
                                ? 'bg-[var(--accent-primary)] text-white border-transparent'
                                : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-element)]'
                        }`}
                    >
                        {t(agent.nameKey, lang)}
                    </button>
                ))}
            </div>
        </div>
    );
};


export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  isOpen, onClose, onGenerateSummary, onExtractActionItems, onExtractTopics,
  analysisResult, isProcessing, isSessionLoaded, lang,
  onProofreadAndStyle, selectedStyle, onStyleChange,
  onExportAnalysis, onExportStyledText, onClearStyledText,
  onAskAIAgent, aiChatHistory, selectedAIAgents, onSelectedAIAgentsChange,
  onExtractEntities
}) => {
  const [agentPrompt, setAgentPrompt] = useState('');
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory]);

  const handleAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentPrompt.trim() && selectedAIAgents.length > 0) {
      onAskAIAgent(agentPrompt.trim());
      setAgentPrompt('');
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-96 h-screen flex-shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-color)] flex flex-col z-30 animate-in slide-in-from-right-10 duration-300">
      <header className="p-4 flex justify-between items-center border-b border-[var(--border-color)] flex-shrink-0">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <LightbulbIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <span>{t('insights', lang)}</span>
        </h2>
        <button onClick={onClose} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-element-hover)] hover:text-[var(--text-primary)]">
          <XIcon className="w-5 h-5" />
        </button>
      </header>
      
      <div className="p-4 flex-grow overflow-y-auto space-y-6">
        {!isSessionLoaded ? (
            <div className="text-center text-sm text-[var(--text-secondary)] p-4 bg-[var(--bg-subtle)] rounded-lg">
                <p>{t('insightsDescription', lang)}</p>
            </div>
        ) : (
            <>
                <Section 
                    title={t('summary', lang)} 
                    icon={<FileTextIcon className="w-5 h-5"/>}
                    actions={analysisResult?.summary && <ExportMenu onExport={(format) => onExportAnalysis('summary', format)} lang={lang} title={t('exportAnalysis', lang)} />}
                >
                    {analysisResult?.summary ? (
                        <p className="px-3 py-2 text-sm whitespace-pre-wrap">{analysisResult.summary}</p>
                    ) : (
                        <button onClick={onGenerateSummary} disabled={isProcessing.summary} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                            {isProcessing.summary ? <><LoadingSpinner /> {t('generatingSummary', lang)}</> : t('generateSummary', lang)}
                        </button>
                    )}
                </Section>
                
                <Section 
                    title={t('actionItems', lang)} 
                    icon={<ListChecksIcon className="w-5 h-5"/>}
                    actions={analysisResult?.actionItems && analysisResult.actionItems.length > 0 && <ExportMenu onExport={(format) => onExportAnalysis('actionItems', format)} lang={lang} title={t('exportAnalysis', lang)} />}
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
                </Section>
                
                <Section 
                    title={t('keyTopics', lang)} 
                    icon={<TagsIcon className="w-5 h-5"/>}
                    actions={analysisResult?.keyTopics && analysisResult.keyTopics.length > 0 && <ExportMenu onExport={(format) => onExportAnalysis('keyTopics', format)} lang={lang} title={t('exportAnalysis', lang)} />}
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
                            {isProcessing.topics ? <><LoadingSpinner /> {t('extractingKeyTopics', lang)}</> : t('extractingKeyTopics', lang)}
                        </button>
                    )}
                </Section>

                <Section title={t('textAnalysis', lang)} icon={<ScanTextIcon className="w-5 h-5" />}>
                     <div className="px-3 py-2">
                        {analysisResult?.entities && analysisResult.entities.length > 0 ? (
                            <p className="text-sm italic">{analysisResult.entities.length} entities found and highlighted in the chat.</p>
                        ) : (
                           <button onClick={onExtractEntities} disabled={isProcessing.entities} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                                {isProcessing.entities ? <><LoadingSpinner /> {t('findingEntities', lang)}</> : t('findEntities', lang)}
                            </button>
                        )}
                    </div>
                </Section>

                <div className="border-t border-[var(--border-color)] my-4"></div>

                <Section 
                    title={t('textEditor', lang)} 
                    icon={<EditIcon className="w-5 h-5"/>}
                    actions={analysisResult?.styledText && (
                        <div className="flex items-center gap-2">
                            <button onClick={onClearStyledText} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)] rounded-full" title={t('changeStyle', lang)}>
                                <RefreshCwIcon className="w-5 h-5"/>
                            </button>
                            <ExportMenu onExport={onExportStyledText} lang={lang} title={t('exportStyledText', lang)} />
                        </div>
                    )}
                >
                    {isProcessing.proofread ? (
                        <div className="flex items-center justify-center gap-2 w-full p-2 rounded-md">
                            <LoadingSpinner /> 
                            <span>{t('generatingStyledText', lang)}</span>
                        </div>
                    ) : analysisResult?.styledText ? (
                        <div className="px-3 py-2 text-sm whitespace-pre-wrap bg-[var(--bg-subtle)] rounded-md">
                            {analysisResult.styledText.text}
                        </div>
                    ) : (
                       <div className="px-3 py-2 space-y-3">
                            <div>
                                <label htmlFor="style-select" className="text-sm text-[var(--text-secondary)] mb-1 block">{t('selectStyle', lang)}</label>
                                <select
                                    id="style-select"
                                    value={selectedStyle}
                                    onChange={(e) => onStyleChange(e.target.value as TextStyle)}
                                    className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                                >
                                    {textStyles.map(style => (
                                        <option key={style} value={style}>
                                            {t(`style${style.charAt(0).toUpperCase() + style.slice(1)}` as any, lang)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={onProofreadAndStyle} disabled={isProcessing.proofread} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                                {t('generateStyledText', lang)}
                            </button>
                       </div>
                    )}
                </Section>
                 <div className="border-t border-[var(--border-color)] my-4"></div>
                <Section title={t('aiChat', lang)} icon={<UsersIcon className="w-5 h-5" />}>
                   <AgentSelector selectedAgents={selectedAIAgents} onChange={onSelectedAIAgentsChange} lang={lang} />
                    <div className="px-3 py-2 space-y-2">
                        <div className="max-h-60 overflow-y-auto space-y-3 text-sm pr-2">
                            {aiChatHistory.map((msg, i) => (
                                <div key={i} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-[var(--bg-element)]' : 'bg-transparent'}`}>
                                    <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                                </div>
                            ))}
                            {isProcessing.agent && (
                                 <div className="flex items-center gap-2 text-sm p-2 text-[var(--text-placeholder)]">
                                     <LoadingSpinner />
                                     <span>{t('agentThinking', lang)}</span>
                                 </div>
                            )}
                            <div ref={aiChatEndRef} />
                        </div>
                        <form onSubmit={handleAgentSubmit} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={agentPrompt}
                                onChange={e => setAgentPrompt(e.target.value)}
                                placeholder={t('askAIAgent', lang)}
                                disabled={isProcessing.agent || selectedAIAgents.length === 0}
                                className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-50"
                            />
                            <button type="submit" disabled={isProcessing.agent || !agentPrompt.trim() || selectedAIAgents.length === 0} className="p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <SendIcon className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>
                </Section>
            </>
        )}
      </div>
    </aside>
  );
};