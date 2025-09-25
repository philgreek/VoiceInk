

import React, { useState } from 'react';
import { XIcon } from './icons';
import type { Settings } from '../types';
import { produce } from 'immer';
import { t, availableLanguages, Language } from '../utils/translations';

interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onSave: (newSettings: Settings) => void;
  lang: Language;
}

const colors = [
  { name: 'Slate', bubble: 'bg-slate-700', avatar: 'bg-slate-600' },
  { name: 'Cyan', bubble: 'bg-cyan-600', avatar: 'bg-cyan-800' },
  { name: 'Blue', bubble: 'bg-blue-600', avatar: 'bg-blue-800' },
  { name: 'Emerald', bubble: 'bg-emerald-600', avatar: 'bg-emerald-800' },
  { name: 'Amber', bubble: 'bg-amber-600', avatar: 'bg-amber-800' },
  { name: 'Rose', bubble: 'bg-rose-600', avatar: 'bg-rose-800' },
  { name: 'Purple', bubble: 'bg-gradient-to-br from-purple-600 to-indigo-600', avatar: 'bg-purple-800' },
];

const themes = [
    { id: 'dark', name: 'Dark' },
    { id: 'light', name: 'Light' },
    { id: 'neutral', name: 'Neutral' },
];

const SpeakerSettings: React.FC<{
    title: string;
    profile: Settings['user'];
    onProfileChange: (newProfile: Settings['user']) => void;
    lang: Language;
    isAssistant?: boolean;
}> = ({ title, profile, onProfileChange, lang, isAssistant = false }) => (
    <div className="space-y-4 p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-color)]">
        <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
        <div>
            <label htmlFor={`${title}-initial`} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                {t('avatarInitial', lang)}
            </label>
            <input
                type="text"
                id={`${title}-initial`}
                value={profile.initial}
                onChange={(e) => onProfileChange({ ...profile, initial: e.target.value.slice(0, 2).toUpperCase() })}
                maxLength={2}
                className="w-12 text-center bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
            />
        </div>
        <div>
            <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{t('color', lang)}</span>
            <div className="flex flex-wrap gap-3">
                {(isAssistant ? colors.filter(c => c.name === 'Purple') : colors.filter(c => c.name !== 'Purple')).map((color) => (
                    <button
                        key={color.name}
                        onClick={() => onProfileChange({ ...profile, bubbleColor: color.bubble, avatarColor: color.avatar })}
                        className={`w-8 h-8 rounded-full ${color.bubble} transition-transform transform hover:scale-110 ${profile.bubbleColor === color.bubble ? `ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] ring-white` : ''}`}
                        aria-label={`Set color to ${color.name}`}
                    />
                ))}
            </div>
        </div>
    </div>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSave,
  lang,
}) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  const handleSave = () => {
    onSave(localSettings);
  };
  
  const handleProfileChange = (key: 'user' | 'interlocutor' | 'assistant', newProfile: Settings['user']) => {
    setLocalSettings(produce(draft => {
        draft[key] = newProfile;
    }));
  };
  
  const handleThemeChange = (theme: Settings['theme']) => {
     setLocalSettings(produce(draft => {
        draft.theme = theme;
    }));
  };

  const handleLanguageChange = (language: string) => {
    setLocalSettings(produce(draft => {
        draft.language = language;
    }));
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-lg p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('settings', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-4 p-4 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-color)]">
                <h3 className="font-semibold text-[var(--text-primary)]">{t('interface', lang)}</h3>
                 <div>
                    <label htmlFor="theme-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('theme', lang)}</label>
                    <select
                        id="theme-select"
                        value={localSettings.theme}
                        onChange={(e) => handleThemeChange(e.target.value as Settings['theme'])}
                        className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                    >
                        {themes.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="language-select" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('language', lang)}</label>
                     <select
                        id="language-select"
                        value={localSettings.language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-2 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                    >
                        {availableLanguages.map(langInfo => <option key={langInfo.code} value={langInfo.code}>{langInfo.name}</option>)}
                    </select>
                </div>
            </div>
           <SpeakerSettings 
                title={t('you', lang)}
                profile={localSettings.user}
                onProfileChange={(p) => handleProfileChange('user', p)}
                lang={lang}
           />
            <SpeakerSettings 
                title={t('speaker', lang)}
                profile={localSettings.interlocutor}
                onProfileChange={(p) => handleProfileChange('interlocutor', p)}
                lang={lang}
           />
           <SpeakerSettings 
                title={t('assistant', lang)}
                profile={localSettings.assistant}
                onProfileChange={(p) => handleProfileChange('assistant', p)}
                lang={lang}
                isAssistant
           />
        </div>
         <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)] transition-colors"
            >
              {t('cancel', lang)}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors"
            >
              {t('saveChanges', lang)}
            </button>
          </div>
      </div>
    </div>
  );
};