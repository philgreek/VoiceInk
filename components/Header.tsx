
import React from 'react';
import { DownloadIcon, TrashIcon, SettingsIcon, UndoIcon, RedoIcon, QuestionMarkCircleIcon } from './icons';
import { t, Language } from '../utils/translations';

interface HeaderProps {
  onExport: () => void;
  onClear: () => void;
  onSettings: () => void;
  onHistoryClick: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onHelpClick: () => void;
  lang: Language;
  isEditing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onClear, onSettings, onHistoryClick, onUndo, onRedo, canUndo, canRedo, onHelpClick, lang, isEditing }) => {
  const buttonClasses = "p-2 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-slate-800/50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  return (
    <header className="flex-shrink-0 flex items-center py-4 px-4 sm:py-6 sm:px-6 border-b border-slate-800 sticky top-0 bg-slate-900/80 backdrop-blur-sm z-30">
      <div className="flex items-center gap-2">
         <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            <span>Voice</span><span className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">Ink</span>
         </h1>
      </div>
      
      <div className="flex-grow" />

      <div className="flex items-center gap-1 sm:gap-2" data-tour-id="header-controls">
         <button
          onClick={onUndo}
          disabled={!canUndo || isEditing}
          className={buttonClasses}
          aria-label={t('undo', lang)}
        >
          <UndoIcon className="w-7 h-7" />
        </button>
         <button
          onClick={onRedo}
          disabled={!canRedo || isEditing}
          className={buttonClasses}
          aria-label={t('redo', lang)}
        >
          <RedoIcon className="w-7 h-7" />
        </button>
        <div className="w-px h-7 bg-slate-800 mx-2"></div>
        <button
          onClick={onExport}
          disabled={isEditing}
          className={buttonClasses}
          aria-label={t('exportChat', lang)}
        >
          <DownloadIcon className="w-7 h-7" />
        </button>
        <button
          onClick={onSettings}
          disabled={isEditing}
          className={`${buttonClasses} rounded-full`}
          aria-label={t('settings', lang)}
        >
          <SettingsIcon className="w-7 h-7" />
        </button>
        <button
          onClick={onHelpClick}
          disabled={isEditing}
          className={buttonClasses}
          aria-label={t('help', lang)}
        >
          <QuestionMarkCircleIcon className="w-7 h-7" />
        </button>
        <button
          onClick={onClear}
          disabled={isEditing}
          className={`${buttonClasses} rounded-full hover:text-red-500`}
          aria-label={t('clearChat', lang)}
        >
          <TrashIcon className="w-7 h-7" />
        </button>
      </div>
    </header>
  );
};
