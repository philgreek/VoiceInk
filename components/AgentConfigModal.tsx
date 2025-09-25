

import React, { useState, useMemo } from 'react';
import { XIcon } from './icons';
// FIX: Import `translations` object to correctly type the translation keys.
import { t, Language, translations } from '../utils/translations';
import { AIAgentExpertise, AIAgentDomain } from '../types';

interface AgentConfigModalProps {
  initialSelectedAgents: { expertise: AIAgentExpertise[], domains: AIAgentDomain[] };
  onClose: () => void;
  onSave: (newAgents: { expertise: AIAgentExpertise[], domains: AIAgentDomain[] }) => void;
  lang: Language;
}

// FIX: Use `keyof typeof translations.en` to correctly type the `nameKey` property.
const allExpertise: { id: AIAgentExpertise, nameKey: keyof typeof translations.en }[] = [
    { id: 'interviewer', nameKey: 'agentInterviewer' }, { id: 'reporter', nameKey: 'agentReporter' }, 
    { id: 'recruiter', nameKey: 'agentRecruiter' }, { id: 'sociologist', nameKey: 'agentSociologist' }, 
    { id: 'screenwriter', nameKey: 'agentScreenwriter' }, { id: 'translator', nameKey: 'agentTranslator' },
    { id: 'marketing_analyst', nameKey: 'agentMarketing_analyst' }, { id: 'tech_support', nameKey: 'agentTech_support' },
    { id: 'business_analyst', nameKey: 'agentBusiness_analyst' }, { id: 'financial_advisor', nameKey: 'agentFinancial_advisor' },
    { id: 'project_manager', nameKey: 'agentProject_manager' }, { id: 'course_developer', nameKey: 'agentCourse_developer' },
    { id: 'academic_researcher', nameKey: 'agentAcademic_researcher' }, { id: 'therapist', nameKey: 'agentTherapist' },
    { id: 'legal_assistant', nameKey: 'agentLegal_assistant' }, { id: 'detective', nameKey: 'agentDetective' },
    { id: 'chef_nutritionist', nameKey: 'agentChef_nutritionist' }, { id: 'customer_manager', nameKey: 'agentCustomer_manager' },
    { id: 'psychologist', nameKey: 'agentPsychologist' }, { id: 'coach', nameKey: 'agentCoach' },
    { id: 'editor', nameKey: 'agentEditor' }, { id: 'tutor', nameKey: 'agentTutor' },
    { id: 'speechwriter', nameKey: 'agentSpeechwriter' },
];

// FIX: Use `keyof typeof translations.en` to correctly type the `nameKey` property.
const allDomains: { id: AIAgentDomain, nameKey: keyof typeof translations.en }[] = [
    { id: 'general', nameKey: 'domainGeneral' }, { id: 'technology', nameKey: 'domainTechnology' },
    { id: 'finance', nameKey: 'domainFinance' }, { id: 'healthcare', nameKey: 'domainHealthcare' },
    { id: 'law', nameKey: 'domainLaw' }, { id: 'education', nameKey: 'domainEducation' },
    { id: 'art_culture', nameKey: 'domainArt_culture' }, { id: 'science', nameKey: 'domainScience' },
    { id: 'business_management', nameKey: 'domainBusiness_management' }, { id: 'human_resources', nameKey: 'domainHuman_resources' },
    { id: 'marketing_sales', nameKey: 'domainMarketing_sales' }, { id: 'customer_service', nameKey: 'domainCustomer_service' },
    { id: 'psychology', nameKey: 'domainPsychology' }, { id: 'career_development', nameKey: 'domainCareer_development' },
    { id: 'cooking_nutrition', nameKey: 'domainCooking_nutrition' }, { id: 'journalism', nameKey: 'domainJournalism' },
    { id: 'filmmaking', nameKey: 'domainFilmmaking' }, { id: 'constitutional_law', nameKey: 'domainConstitutional_law' },
    { id: 'litigation', nameKey: 'domainLitigation' },
];

const Column = <T extends string>({ title, items, selected, onToggle, searchTerm, onSearchChange, lang }: {
    title: string;
    // FIX: Use `keyof typeof translations.en` to correctly type the `nameKey` property on items.
    items: { id: T, nameKey: keyof typeof translations.en }[];
    selected: T[];
    onToggle: (id: T) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    lang: Language;
}) => {
    const filteredItems = useMemo(() => 
        items.filter(item => 
            // FIX: The type of `item.nameKey` is now correct, resolving the error.
            t(item.nameKey, lang).toLowerCase().includes(searchTerm.toLowerCase())
        ), [items, searchTerm, lang]);

    const buttonClass = (id: T) => `w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
        selected.includes(id) 
            ? 'bg-[var(--accent-primary)] text-white' 
            : 'bg-[var(--bg-element)] text-[var(--text-primary)] hover:bg-[var(--bg-element-hover)]'
    }`;
    
    return (
        <div className="flex-1 flex flex-col gap-3 min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`${t('search', lang)}`}
                className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
            />
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 border-r border-[var(--border-color)]">
                {filteredItems.map(item => (
                    <button key={item.id} onClick={() => onToggle(item.id)} className={buttonClass(item.id)}>
                        {/* FIX: The type of `item.nameKey` is now correct, resolving the error. */}
                        {t(item.nameKey, lang)}
                    </button>
                ))}
            </div>
        </div>
    );
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ initialSelectedAgents, onClose, onSave, lang }) => {
    const [selectedExpertise, setSelectedExpertise] = useState<AIAgentExpertise[]>(initialSelectedAgents.expertise);
    const [selectedDomains, setSelectedDomains] = useState<AIAgentDomain[]>(initialSelectedAgents.domains);
    const [expertiseSearch, setExpertiseSearch] = useState('');
    const [domainSearch, setDomainSearch] = useState('');

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
            <Column
                title={t('agentExpertiseTitle', lang)}
                items={allExpertise}
                selected={selectedExpertise}
                onToggle={toggleExpertise}
                searchTerm={expertiseSearch}
                onSearchChange={setExpertiseSearch}
                lang={lang}
            />
             <Column
                title={t('agentDomainTitle', lang)}
                items={allDomains}
                selected={selectedDomains}
                onToggle={toggleDomain}
                searchTerm={domainSearch}
                onSearchChange={setDomainSearch}
                lang={lang}
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
