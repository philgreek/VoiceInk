
import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import type { Message, Settings } from '../types';
import { EditIcon, CheckIcon, XIcon } from './icons';
import { t, Language } from '../utils/translations';

interface ChatMessageProps {
  message: Message;
  settings: Settings;
  onUpdateMessage: (id: string, newText: string) => void;
  onChangeSpeaker: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onSplitMessage: (messageId: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => void;
  isFirstMessage: boolean;
  lang: Language;
  isActive: boolean;
  onSeekAudio: (time: number) => void;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ 
    message, settings, onUpdateMessage, onChangeSpeaker, onDeleteMessage, onSplitMessage, isFirstMessage, lang, isActive, onSeekAudio 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [editWidth, setEditWidth] = useState<number | null>(null);
  const [splitMenu, setSplitMenu] = useState<{ text: string } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const messageContentRef = useRef<HTMLDivElement>(null);
  const splitMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, editText]);

  useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
        if (splitMenuRef.current && !splitMenuRef.current.contains(event.target as Node)) {
          // Check if the click is outside the message content as well to avoid immediate closing
          if (messageContentRef.current && !messageContentRef.current.contains(event.target as Node)) {
            setSplitMenu(null);
          }
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    if (bubbleRef.current) setEditWidth(bubbleRef.current.offsetWidth);
    setEditText(message.text);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editText.trim() !== message.text) onUpdateMessage(message.id, editText.trim());
    setIsEditing(false);
    setEditWidth(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditWidth(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
    }
    if (e.key === 'Escape') handleCancel();
  };

  const handleMouseUp = (event: React.MouseEvent) => {
      event.stopPropagation();
      setTimeout(() => {
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim();
          
          if (selectedText && messageContentRef.current?.contains(selection.anchorNode)) {
               setSplitMenu({ text: selectedText });
          } else if (!selection || selection.toString().trim() === '') {
              setSplitMenu(null);
          }
      }, 0);
  };

  const isUser = message.sender === 'user';
  const profile = isUser ? settings.user : settings.interlocutor;
  
  const activeClasses = isActive ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-main)] ring-[var(--accent-primary)]' : '';
  const bubbleClasses = `${profile.bubbleColor} ${isEditing ? 'ring-2 ring-red-500' : ''} ${activeClasses}`;
  const controlButtonClasses = "control-button p-1.5 rounded-full text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:text-white transition-all";
  
  const handleSplit = (speaker: 'user' | 'interlocutor') => {
      if (splitMenu) {
          onSplitMessage(message.id, splitMenu.text, speaker);
          setSplitMenu(null);
      }
  }

  const speakerOptions = [
    { type: 'user' as const, profile: settings.user },
    { type: 'interlocutor' as const, profile: settings.interlocutor },
  ];

  return (
    <div className="flex justify-start items-start gap-3 group relative">
      <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onChangeSpeaker(message.id); }}
            className={`w-10 h-10 rounded-full ${profile.avatarColor} flex items-center justify-center font-bold text-slate-300 flex-shrink-0 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] focus:ring-white`}
            aria-label={t('changeSpeaker', lang)}
          >
            {profile.initial}
          </button>
          
          {splitMenu && (
              <div 
                ref={splitMenuRef}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-20 flex flex-col gap-2 p-1.5 rounded-lg bg-[var(--bg-surface)] shadow-lg ring-1 ring-red-500"
                onClick={(e) => e.stopPropagation()}
               >
                 {speakerOptions.map(({ type, profile }) => (
                    <button
                        key={type}
                        onClick={() => handleSplit(type)}
                        className={`w-9 h-9 rounded-full ${profile.avatarColor} flex items-center justify-center font-bold text-slate-300 transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-white/50`}
                        title={`${t('splitInto', lang)} ${type === 'user' ? t('you', lang) : t('speaker', lang)} (${profile.initial})`}
                    >
                        {profile.initial}
                    </button>
                  ))}
              </div>
          )}
      </div>
      
      <div 
        ref={bubbleRef}
        className={`relative py-3 px-4 text-white max-w-xs md:max-w-md lg:max-w-lg break-words shadow-md min-h-24 rounded-lg cursor-pointer ${bubbleClasses}`}
        style={{ width: isEditing && editWidth ? `${editWidth}px` : 'auto' }}
        onClick={() => onSeekAudio(message.timestamp)}
      >
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-white w-full resize-none focus:outline-none -m-1 p-1"
              rows={1}
            />
            <div className="flex justify-end gap-2 mt-1">
              <button onClick={handleSave} className="text-green-400 hover:text-green-300"> <CheckIcon className="w-5 h-5"/> </button>
              <button onClick={handleCancel} className="text-red-400 hover:text-red-300"> <XIcon className="w-5 h-5"/> </button>
            </div>
          </div>
        ) : (
           <div ref={messageContentRef} onMouseUp={handleMouseUp}>
              {message.text || <span className="text-[var(--text-secondary)] italic">...</span>}
          </div>
        )}

         {!isEditing && message.text && !isFirstMessage && (
            <button 
                onClick={(e) => { e.stopPropagation(); onDeleteMessage(message.id); }} 
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/20 text-white/60 hover:text-white/100 hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity control-button"
                aria-label={t('deleteMessage', lang)}
            >
                <XIcon className="w-4 h-4" />
            </button>
         )}
      </div>
      
      {!isEditing && message.text && (
        <div className="absolute left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} className={controlButtonClasses} aria-label={t('editMessage', lang)}>
                <EditIcon className="w-5 h-5" />
            </button>
        </div>
      )}
      
    </div>
  );
};

export const ChatMessage = memo(ChatMessageComponent);
