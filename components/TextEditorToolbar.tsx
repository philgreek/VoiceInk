
import React from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, ListOrderedIcon } from './icons';
import { t, Language } from '../utils/translations';

interface TextEditorToolbarProps {
  messageId: string;
}

export const TextEditorToolbar: React.FC<TextEditorToolbarProps> = ({ messageId }) => {
  
  const handleFormat = (command: string) => {
    // This is a legacy but simple way to format contentEditable divs
    document.execCommand(command, false);
  };

  const buttonClass = "p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)]";

  return (
    <div className="flex-shrink-0 bg-[var(--bg-surface)] py-1 px-4 sm:px-6 flex items-center justify-center gap-2 border-b border-[var(--border-color)] sticky top-[65px] sm:top-[81px] z-20">
        <button onClick={() => handleFormat('bold')} className={buttonClass} title={t('bold', 'ru')}>
            <BoldIcon className="w-5 h-5" />
        </button>
        <button onClick={() => handleFormat('italic')} className={buttonClass} title={t('italic', 'ru')}>
            <ItalicIcon className="w-5 h-5" />
        </button>
        <button onClick={() => handleFormat('underline')} className={buttonClass} title={t('underline', 'ru')}>
            <UnderlineIcon className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-[var(--border-color)] mx-1"></div>
        <button onClick={() => handleFormat('insertUnorderedList')} className={buttonClass} title={t('bulletList', 'ru')}>
            <ListIcon className="w-5 h-5" />
        </button>
         <button onClick={() => handleFormat('insertOrderedList')} className={buttonClass} title={t('numberedList', 'ru')}>
            <ListOrderedIcon className="w-5 h-5" />
        </button>
    </div>
  );
};
