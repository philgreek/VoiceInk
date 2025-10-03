import React, { useMemo } from 'react';
import { Insight } from '../types';
import { t, Language } from '../utils/translations';

interface InsightRendererProps {
  text: string;
  insights: Insight[];
  isInsightModeActive: boolean;
  lang: Language;
}

const Tooltip: React.FC<{ content: React.ReactNode, children: React.ReactNode }> = ({ content, children }) => {
    return (
        <span className="group relative">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white text-xs rounded-md shadow-lg p-3 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 invisible group-hover:visible">
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                <h4 className="font-bold text-sm mb-1 text-slate-100">{t('termInfo', 'ru')}</h4>
                <div className="text-slate-300">{content}</div>
            </div>
        </span>
    );
};


export const InsightRenderer: React.FC<InsightRendererProps> = ({ text, insights, isInsightModeActive, lang }) => {
  const renderedContent = useMemo(() => {
    if (!isInsightModeActive || !insights || insights.length === 0) {
      return text;
    }

    const sortedInsights = [...insights].sort((a, b) => b.term.length - a.term.length);
    const insightMap = new Map(sortedInsights.map(i => [i.term.toLowerCase(), i]));
    const termsRegex = new RegExp(`\\b(${sortedInsights.map(i => i.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`, 'gi');

    const parts = text.split(termsRegex);
    
    return parts.map((part, index) => {
      const lowerPart = part?.toLowerCase();
      if (part && insightMap.has(lowerPart)) {
        const insight = insightMap.get(lowerPart)!;
        return (
          <Tooltip key={index} content={insight.definition}>
            <span className="border-b-2 border-purple-500 border-dotted cursor-pointer">
                {part}
            </span>
          </Tooltip>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });

  }, [text, insights, isInsightModeActive, lang]);

  return <>{renderedContent}</>;
};