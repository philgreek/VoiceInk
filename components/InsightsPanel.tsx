
import React from 'react';
import { AnalysisResult, TextStyle } from '../types';
import { t, Language } from '../utils/translations';
import { XIcon, LightbulbIcon, FileTextIcon, ListChecksIcon, TagsIcon, EditIcon } from './icons';

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
}

const textStyles: TextStyle[] = [
    'default', 'meeting', 'lecture', 'dialogue', 'interview', 'consultation', 
    'podcast', 'blog', 'business', 'literary', 'psychological', 'legal', 'scientific'
];

const LoadingSpinner: React.FC = () => (
    <div className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin"></div>
);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ title, icon, children }) => (
    <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            {icon}
            <span>{title}</span>
        </h3>
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
                <Section title={t('summary', lang)} icon={<FileTextIcon className="w-5 h-5"/>}>
                    {analysisResult?.summary ? (
                        <p className="px-3 py-2 text-sm whitespace-pre-wrap">{analysisResult.summary}</p>
                    ) : (
                        <button onClick={onGenerateSummary} disabled={isProcessing.summary} className="flex items-center justify-center gap-2 w-full p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors disabled:opacity-70 disabled:cursor-wait">
                            {isProcessing.summary ? <><LoadingSpinner /> {t('generatingSummary', lang)}</> : t('generateSummary', lang)}
                        </button>
                    )}
                </Section>
                
                <Section title={t('actionItems', lang)} icon={<ListChecksIcon className="w-5 h-5"/>}>
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
                
                <Section title={t('keyTopics', lang)} icon={<TagsIcon className="w-5 h-5"/>}>
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
                            {isProcessing.proofread ? <><LoadingSpinner /> {t('generatingStyledText', lang)}</> : t('generateStyledText', lang)}
                        </button>
                   </div>
                </Section>
            </>
        )}
      </div>
    </aside>
  );
};
