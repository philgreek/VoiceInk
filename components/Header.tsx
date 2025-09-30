
import React, { useState, useEffect, useRef } from 'react';
import { SettingsIcon, UndoIcon, RedoIcon, QuestionMarkCircleIcon, EditIcon } from './icons';
import { t, Language } from '../utils/translations';

interface HeaderProps {
  sessionName: string;
  onRenameSession: (newName: string) => void;
  onSettings: () => void;
  onHistoryClick: (event: React.MouseEvent) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onHelpClick: () => void;
  lang: Language;
  isEditing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ sessionName, onRenameSession, onSettings, onHistoryClick, onUndo, onRedo, canUndo, canRedo, onHelpClick, lang, isEditing }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(sessionName);
  const inputRef = useRef<HTMLInputElement>(null);

  const buttonClasses = "p-2 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-element)] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (!isEditingName) {
      setEditingName(sessionName);
    }
  }, [sessionName, isEditingName]);

  const handleSaveName = () => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== sessionName) {
      onRenameSession(trimmedName);
    } else {
      setEditingName(sessionName); // Revert to original if empty or unchanged
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    }
    if (e.key === 'Escape') {
      setEditingName(sessionName);
      setIsEditingName(false);
    }
  };

  return (
    <header className="flex-shrink-0 flex items-center justify-between py-2 px-2 sm:px-0 z-30">
      <div className="flex items-center gap-3">
         <button onClick={onHistoryClick} aria-label={t('sessionHistory', lang)} className="transition-transform transform hover:scale-105">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
                <span>Voice</span><span className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">Ink</span>
            </h1>
         </button>
         <div className="w-px h-5 bg-slate-700 hidden sm:block"></div>
         <div className="group relative flex items-center">
            {isEditingName ? (
              <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  className="bg-[var(--bg-element)] text-base font-semibold text-slate-200 rounded-md px-2 py-0 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            ) : (
                <button
                    onClick={() => setIsEditingName(true)}
                    className="text-base font-semibold text-slate-300 truncate hidden md:flex items-center gap-2 hover:bg-[var(--bg-element)] px-2 py-0 rounded-md"
                    title={sessionName}
                >
                    {sessionName}
                    <EditIcon className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            )}
         </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2" data-tour-id="header-controls">
         <button
          onClick={onUndo}
          disabled={!canUndo || isEditing}
          className={buttonClasses}
          aria-label={t('undo', lang)}
        >
          <UndoIcon className="w-5 h-5" />
        </button>
         <button
          onClick={onRedo}
          disabled={!canRedo || isEditing}
          className={buttonClasses}
          aria-label={t('redo', lang)}
        >
          <RedoIcon className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-slate-700 mx-1"></div>
        <button
          onClick={onSettings}
          disabled={isEditing}
          className={buttonClasses}
          aria-label={t('settings', lang)}
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onHelpClick}
          disabled={isEditing}
          className={buttonClasses}
          aria-label={t('help', lang)}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};