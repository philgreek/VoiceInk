import React, { useState, useMemo } from 'react';
import { XIcon } from './icons';
import { t, Language } from '../utils/translations';
import { AIAgentExpertise, AIAgentDomain, SessionProfileId, AIAgentExpertiseItem, AIAgentDomainItem } from '../types';
import { profiles } from '../utils/profiles';
import { allExpertise, allDomains } from '../utils/agentConfigData';


interface AgentConfigModalProps {
  initialSelectedAgents: { expertise: AIAgentExpertise[], domains: AIAgentDomain[] };
  onClose: () => void;
  onSave: (newAgents: { expertise: AIAgentExpertise[], domains: AIAgentDomain[] }) => void;
  lang: Language;
  profileId: SessionProfileId;
}

type SortType = 'group' | 'alpha';

const Column = <T extends string, I extends { id: T; nameKey: any; category: string }>({ 
    title, 
    items, 
    selected, 
    onToggle, 
    searchTerm, 
    sortType,
    onSortChange,
    onSearchChange,
    lang, 
    highlightedItems 
}: {
    title: string;
    items: I[];
    selected: T[];
    onToggle: (id: T) => void;
    searchTerm: string;
    sortType: SortType;
    onSortChange: (sortType: SortType) => void;
    onSearchChange: (value: string) => void;
    lang: Language;
    highlightedItems: T[];
}) => {

    const filteredItems = useMemo(() => 
        items.filter(item => 
            t(item.nameKey, lang).toLowerCase().includes(searchTerm.toLowerCase())
        ), [items, searchTerm, lang]);

    const sortedAndGroupedItems = useMemo(() => {
        if (sortType === 'alpha') {
            return { 'all': filteredItems.sort((a, b) => t(a.nameKey, lang).localeCompare(t(b.nameKey, lang))) };
        }
        const grouped: Record<string, I[]> = {};
        filteredItems.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });
        return grouped;
    }, [filteredItems, sortType, lang]);


    const buttonClass = (id: T) => {
        const isSelected = selected.includes(id);
        const isHighlighted = highlightedItems.includes(id);
        
        let classes = 'w-full text-left px-3 py-2 text-sm rounded-md transition-colors ';
        if (isSelected) {
            classes += 'bg-[var(--accent-primary)] text-white';
        } else if (isHighlighted) {
            classes += 'bg-green-500/20 text-[var(--text-primary)] hover:bg-green-500/30';
        } else {
            classes += 'bg-[var(--bg-element)] text-[var(--text-primary)] hover:bg-[var(--bg-element-hover)]';
        }
        return classes;
    };
    
    return (
        <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
                <div className="flex text-xs bg-[var(--bg-element)] rounded-md p-0.5">
                    <button onClick={() => onSortChange('group')} className={`px-2 py-1 rounded ${sortType === 'group' ? 'bg-[var(--bg-surface)]' : ''}`}>{t('sortByGroup', lang)}</button>
                    <button onClick={() => onSortChange('alpha')} className={`px-2 py-1 rounded ${sortType === 'alpha' ? 'bg-[var(--bg-surface)]' : ''}`}>{t('sortByAlphabet', lang)}</button>
                </div>
            </div>
            <input
                type="text"
                value={searchTerm}
                // FIX: The search input was not connected to a state updater.
                // Added onSearchChange prop and connected it to the input's onChange event.
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`${t('search', lang)}`}
                className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
            />
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {Object.entries(sortedAndGroupedItems).map(([category, items]) => (
                    <div key={category}>
                        {sortType === 'group' && (
                            <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] px-3 pt-2 pb-1">
                                {/* FIX: Corrected translation key generation for category. */}
                                {t(category as any, lang)}
                            </h4>
                        )}
                        {/* FIX: Cast `items` to `I[]` to resolve incorrect type inference to `unknown`. */}
                        {(items as I[]).map(item => (
                            <button key={item.id} onClick={() => onToggle(item.id)} className={buttonClass(item.id)}>
                                {t(item.nameKey, lang)}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ initialSelectedAgents, onClose, onSave, lang, profileId }) => {
    const [selectedExpertise, setSelectedExpertise] = useState<AIAgentExpertise[]>(initialSelectedAgents.expertise);
    const [selectedDomains, setSelectedDomains] = useState<AIAgentDomain[]>(initialSelectedAgents.domains);
    const [expertiseSearch, setExpertiseSearch] = useState('');
    const [domainSearch, setDomainSearch] = useState('');
    const [expertiseSort, setExpertiseSort] = useState<SortType>('group');
    const [domainSort, setDomainSort] = useState<SortType>('group');

    const activeProfile = profiles[profileId];

    const handleSave = () => {
        onSave({ expertise: selectedExpertise, domains: selectedDomains.length > 0 ? selectedDomains : ['general'] });
        onClose();
    };

    const toggleExpertise = (id: AIAgentExpertise) => {
        setSelectedExpertise(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
    };

    const toggleDomain = (id: AIAgentDomain) => {
        setSelectedDomains(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    };
    
    const highlightedDomains = useMemo(() => {
        if (selectedExpertise.length === 0) return activeProfile.recommendedDomains;
        const related = selectedExpertise.flatMap(expId => allExpertise.find(e => e.id === expId)?.relatedDomains || []);
        return [...new Set([...related, ...activeProfile.recommendedDomains])];
    }, [selectedExpertise, activeProfile]);

    const highlightedExpertise = useMemo(() => {
        if (selectedDomains.length === 0) return activeProfile.recommendedExpertise;
        const related = selectedDomains.flatMap(domId => allDomains.find(d => d.id === domId)?.relatedExpertise || []);
        return [...new Set([...related, ...activeProfile.recommendedExpertise])];
    }, [selectedDomains, activeProfile]);


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-4xl p-6 sm:p-8 flex flex-col h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('agentConfigTitle', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow flex gap-6 min-h-0">
            <Column<AIAgentExpertise, AIAgentExpertiseItem>
                title={t('agentExpertiseTitle', lang)}
                items={allExpertise}
                selected={selectedExpertise}
                onToggle={toggleExpertise}
                searchTerm={expertiseSearch}
                sortType={expertiseSort}
                onSortChange={setExpertiseSort}
                onSearchChange={setExpertiseSearch}
                lang={lang}
                highlightedItems={highlightedExpertise}
            />
             <Column<AIAgentDomain, AIAgentDomainItem>
                title={t('agentDomainTitle', lang)}
                items={allDomains}
                selected={selectedDomains}
                onToggle={toggleDomain}
                searchTerm={domainSearch}
                sortType={domainSort}
                onSortChange={setDomainSort}
                onSearchChange={setDomainSearch}
                lang={lang}
                highlightedItems={highlightedDomains}
            />
        </div>
        
        <div className="mt-6 flex justify-end gap-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)] transition-colors"
          >
            {t('cancel', lang)}
          </button>
          <button
            onClick={handleSave}
            disabled={selectedExpertise.length === 0}
            className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-50"
          >
            {t('saveChanges', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};