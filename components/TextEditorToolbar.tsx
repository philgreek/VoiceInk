
import React from 'react';
import { SelectionContext } from '../types';
import { t, Language } from '../utils/translations';
import { UsersIcon, EditIcon, TrashIcon, XIcon } from './icons';

interface TextEditorToolbarProps {
  selection: SelectionContext;
  onClose: () => void;
  onSplit: () => void;
  onSpeakerChange: (speaker: 'user' | 'interlocutor') => void;
  onDelete: () => void;
  onEdit: () => void;
  lang: Language;
}

export const TextEditorToolbar: React.FC<TextEditorToolbarProps> = ({
  selection,
  onClose,
  onSplit,
  onSpeakerChange,
  onDelete,
  onEdit,
  lang,
}) => {

  const buttonClass = "px-3 py-2 text-sm flex items-center gap-2 text-[var(--text-primary)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors";
  const separatorClass = "w-px h-5 bg-[var(--border-color)]";

  return (
    <div className="flex-shrink-0 bg-[var(--bg-surface)] py-2 px-4 sm:px-6 flex items-center justify-center gap-2 border-b border-[var(--border-color)] sticky top-[65px] sm:top-[81px] z-20">
      <div className="flex items-center gap-2">
        <button onClick={() => onSpeakerChange('user')} className={buttonClass} title={t('changeToUser', lang)}>
            <UsersIcon className="w-4 h-4" /> {t('you', lang)}
        </button>
        <button onClick={() => onSpeakerChange('interlocutor')} className={buttonClass} title={t('changeToInterlocutor', lang)}>
            <UsersIcon className="w-4 h-4" /> {t('speaker', lang)}
        </button>
        
        <div className={separatorClass}></div>

        <button onClick={onSplit} className={buttonClass} title={t('splitMessage', lang)}>
            {t('splitMessage', lang)}
        </button>
        
        <div className={separatorClass}></div>

        <button onClick={onEdit} className={buttonClass} title={t('editSelection', lang)}>
            <EditIcon className="w-4 h-4" /> {t('editMessage', lang)}
        </button>
         <button onClick={onDelete} className={`${buttonClass} hover:text-red-500`} title={t('deleteSelection', lang)}>
            <TrashIcon className="w-4 h-4" /> {t('deleteMessage', lang).split(' ')[0]}
        </button>

         <div className={separatorClass}></div>
        
        <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full">
            <XIcon className="w-5 h-5"/>
        </button>
      </div>
    </div>
  );
};
