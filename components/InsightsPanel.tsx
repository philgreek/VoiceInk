
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, TextStyle } from '../types';
import { t, Language } from '../utils/translations';
import { XIcon, LightbulbIcon, FileTextIcon, ListChecksIcon, TagsIcon, EditIcon, EllipsisVerticalIcon, ClipboardIcon, DownloadIcon, NotebookIcon } from './icons';

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSummary: () => void;
  onExtractActionItems: () => void;
  onExtractTopics: () => void;
  analysisResult: AnalysisResult | null;
  isProcessing: { summary: boolean; actionItems: boolean; topics: boolean; proofread: boolean };
  isSessionLoaded: boolean;
  lang: Language;
  onProofreadAndStyle: () => void;
  selectedStyle: TextStyle;
  onStyleChange: (style: TextStyle) => void;
  onExportAnalysis: (type: 'summary' | 'actionItems' | 'keyTopics', format: 'copy' | 'txt' | 'notebooklm') => void;
}

const textStyles: TextStyle[] = [
    'default', 'meeting', 'lecture', 'dialogue', 'interview', 'consultation', 
    'podcast', 'blog', 'business', 'literary', 'psychological', 'legal', 'scientific'
];

const LoadingSpinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin"></div>
);

const ExportMenu: React.FC<{ onExport: (format: 'copy' | 'txt' | 'notebooklm') => void, lang: Language }> = ({ onExport, lang }) => {
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
                title={t('exportAnalysis', lang)}
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


export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  isOpen,
  onClose,
  onGenerateSummary,
  onExtractActionItems,
  onExtractTopics,
  analysisResult,
  isProcessing,
  isSessionLoaded,
  lang,
  onProofreadAndStyle,
  selectedStyle,
  onStyleChange,
  onExportAnalysis,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-80 h-screen flex-shrink-0 bg-[var(--bg-surface)] border-l border-[var(--border-color)] flex flex-col z-30 animate-in slide-in-from-right-10 duration-300">
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
                    actions={analysisResult?.summary && <ExportMenu onExport={(format) => onExportAnalysis('summary', format)} lang={lang} />}
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
                    actions={analysisResult?.actionItems && analysisResult.actionItems.length > 0 && <ExportMenu onExport={(format) => onExportAnalysis('actionItems', format)} lang={lang} />}
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
                    actions={analysisResult?.keyTopics && analysisResult.keyTopics.length > 0 && <ExportMenu onExport={(format) => onExportAnalysis('keyTopics', format)} lang={lang} />}
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
                </Section>

                <div className="border-t border-[var(--border-color)] my-4"></div>

                <Section title={t('textEditor', lang)} icon={<EditIcon className="w-5 h-5"/>}>
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
                            {isProcessing.proofread ? <><LoadingSpinner /> {t('generatingStyledText', lang)}</> : t('generatingStyledText', lang)}
                        </button>
                   </div>
                </Section>
            </>
        )}
      </div>
    </aside>
  );
};
