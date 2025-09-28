import React, { useState, useMemo } from 'react';
import { XIcon, SearchIcon, PlusIcon } from './icons';
import { t, Language } from '../utils/translations';
import { StudioToolId, StudioTool } from '../types';
import { studioTools } from '../utils/profiles';

interface StudioConfigModalProps {
  onClose: () => void;
  onSave: (newTools: StudioToolId[]) => void;
  activeTools: StudioToolId[];
  lang: Language;
}

const allToolsArray = Object.values(studioTools);

const ToolItem: React.FC<{
    tool: StudioTool;
    lang: Language;
    onClick: () => void;
    isActive: boolean;
}> = ({ tool, lang, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between gap-3 text-left p-2 rounded-md transition-colors ${
            isActive
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700'
        }`}
    >
        <div className="flex items-center gap-3">
            <tool.icon className="w-5 h-5 text-slate-300 flex-shrink-0" />
            <span className="font-medium text-slate-200 text-sm">{t(tool.nameKey, lang)}</span>
        </div>
        {!isActive && <PlusIcon className="w-4 h-4 text-slate-400" />}
    </button>
);

const ActiveToolItem: React.FC<{
    tool: StudioTool;
    lang: Language;
    onRemove: () => void;
}> = ({ tool, lang, onRemove }) => (
     <div className="w-full flex items-center justify-between gap-3 text-left p-2 rounded-md bg-slate-700">
        <div className="flex items-center gap-3">
            <tool.icon className="w-5 h-5 text-slate-300 flex-shrink-0" />
            <span className="font-medium text-slate-200 text-sm">{t(tool.nameKey, lang)}</span>
        </div>
        <button onClick={onRemove} className="p-1 text-slate-400 hover:text-white rounded-full">
            <XIcon className="w-4 h-4" />
        </button>
    </div>
);


export const StudioConfigModal: React.FC<StudioConfigModalProps> = ({ onClose, onSave, activeTools, lang }) => {
  const [currentActiveTools, setCurrentActiveTools] = useState<StudioToolId[]>(activeTools);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = () => {
    onSave(currentActiveTools);
    onClose();
  };
  
  const addTool = (toolId: StudioToolId) => {
      if (!currentActiveTools.includes(toolId)) {
          setCurrentActiveTools(prev => [...prev, toolId]);
      }
  };

  const removeTool = (toolId: StudioToolId) => {
      setCurrentActiveTools(prev => prev.filter(id => id !== toolId));
  };
  
  const filteredAndGroupedTools = useMemo(() => {
    const filtered = allToolsArray.filter(tool => 
      t(tool.nameKey, lang).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const grouped: Record<string, StudioTool[]> = {};
    filtered.forEach(tool => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = [];
      }
      grouped[tool.category].push(tool);
    });
    return grouped;
  }, [searchTerm, lang]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-xl border border-slate-700 w-full max-w-4xl p-6 sm:p-8 flex flex-col h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-100">{t('configureTools', lang)}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow flex gap-6 min-h-0">
          {/* Available Tools Column */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 bg-slate-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-200">{t('availableTools', lang)}</h3>
            <div className="relative">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('search', lang)}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-md py-2 pl-9 pr-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
            </div>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-2">
                {Object.entries(filteredAndGroupedTools).map(([category, tools]) => (
                    <div key={category}>
                        <h4 className="text-xs font-bold uppercase text-slate-500 px-2 pt-2 pb-1">
                            {t(`toolCategory${category.charAt(0).toUpperCase() + category.slice(1)}` as any, lang)}
                        </h4>
                        <div className="space-y-1">
                            {/* FIX: Cast `tools` to `StudioTool[]` to resolve incorrect type inference to `unknown`. */}
                            {(tools as StudioTool[]).map(tool => (
                                <ToolItem 
                                    key={tool.id}
                                    tool={tool}
                                    lang={lang}
                                    onClick={() => addTool(tool.id)}
                                    isActive={currentActiveTools.includes(tool.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Active Tools Column */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 bg-slate-800/50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-200">{t('activeTools', lang)}</h3>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                {currentActiveTools.map(toolId => {
                    const tool = studioTools[toolId];
                    if (!tool) return null;
                    return (
                        <ActiveToolItem 
                            key={toolId}
                            tool={tool}
                            lang={lang}
                            onRemove={() => removeTool(toolId)}
                        />
                    );
                })}
                 {currentActiveTools.length === 0 && (
                    <div className="text-center text-sm text-slate-500 py-10">
                        Click on tools from the left to add them here.
                    </div>
                )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-4 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600">
            {t('cancel', lang)}
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-cyan-500 text-white font-semibold rounded-md hover:bg-cyan-600">
            {t('saveChanges', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};