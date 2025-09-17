

import React, { useState, useRef, useEffect, memo } from 'react';
import type { Message, Settings } from '../types';
import { EditIcon, CheckIcon, XIcon, SwapIcon } from './icons';
import { t, Language } from '../utils/translations';

interface ChatMessageProps {
  message: Message;
  settings: Settings;
  onUpdateMessage: (id: string, newText: string) => void;
  onChangeSpeaker: (id: string) => void;
  onSplitMessage: (id: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => void;
  onDeleteMessage: (id: string) => void;
  isFirstMessage: boolean;
  lang: Language;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, settings, onUpdateMessage, onChangeSpeaker, onSplitMessage, onDeleteMessage, isFirstMessage, lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [editWidth, setEditWidth] = useState<number | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, editText]);
  
  // Close selection popup if user clicks away
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (selectedText && bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
            setSelectedText(null);
            setPopupPosition(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedText]);


  const handleEdit = () => {
    if (bubbleRef.current) {
      setEditWidth(bubbleRef.current.offsetWidth);
    }
    setEditText(message.text);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editText.trim() !== message.text) {
      onUpdateMessage(message.id, editText.trim());
    }
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
    if (e.key === 'Escape') {
        handleCancel();
    }
  };
  
  const handleMouseUp = () => {
    if (isEditing) return;
    const selection = window.getSelection();
    const selectedString = selection?.toString().trim();

    // Check if the selection is contained within the message text element
    if (selectedString && selection && textContainerRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = textContainerRef.current.getBoundingClientRect();
      
      setSelectedText(selectedString);
      setPopupPosition({
        top: rect.top - containerRect.top - 45, // Position 45px above the selection
        left: rect.left - containerRect.left + (rect.width / 2),
      });
    } else {
      // Only clear selection if we are not clicking on an action button
      const target = event?.target as HTMLElement;
      if (!target.closest('.split-popup-button') && !target.closest('.control-button')) {
         setSelectedText(null);
         setPopupPosition(null);
      }
    }
  };
  
  const handleSplit = (newSpeaker: 'user' | 'interlocutor') => {
    if (selectedText) {
      onSplitMessage(message.id, selectedText, newSpeaker);
    }
    setSelectedText(null);
    setPopupPosition(null);
  };

  const isUser = message.sender === 'user';
  const profile = isUser ? settings.user : settings.interlocutor;

  const bubbleRounding = 'rounded-br-3xl rounded-tr-3xl rounded-tl-xl';
  const bubbleClasses = `${profile.bubbleColor} ${bubbleRounding} ${isEditing ? 'ring-2 ring-red-500' : ''}`;
  const controlButtonClasses = "control-button p-1.5 rounded-full text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:text-white transition-all";
  
  return (
    <div className="flex justify-start items-start gap-3 group relative">
      {/* Avatar is always on the left */}
      <div className={`w-10 h-10 rounded-full ${profile.avatarColor} flex items-center justify-center font-bold text-slate-300 flex-shrink-0`}>
        {profile.initial}
      </div>
      
      <div 
        ref={bubbleRef}
        className={`relative py-3 px-4 text-white max-w-xs md:max-w-md lg:max-w-lg break-words shadow-md min-h-24 ${bubbleClasses}`}
        style={{ width: isEditing && editWidth ? `${editWidth}px` : 'auto' }}
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
              <button onClick={handleSave} className="text-green-400 hover:text-green-300">
                <CheckIcon className="w-5 h-5"/>
              </button>
              <button onClick={handleCancel} className="text-red-400 hover:text-red-300">
                <XIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        ) : (
           <div onMouseUp={handleMouseUp} ref={textContainerRef}>
              {message.text || <span className="text-[var(--text-secondary)] italic">...</span>}
          </div>
        )}

        {selectedText && popupPosition && (
          <div
            className="absolute z-20 flex gap-2 bg-[var(--bg-surface)] p-1 rounded-full shadow-lg"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <button
              onClick={() => handleSplit('user')}
              className={`split-popup-button w-8 h-8 rounded-full ${settings.user.avatarColor} flex items-center justify-center font-bold text-slate-300 transition-transform hover:scale-110`}
              title={`${t('splitInto', lang)} ${t('you', lang)} (${settings.user.initial})`}
            >
              {settings.user.initial}
            </button>
            <button
              onClick={() => handleSplit('interlocutor')}
              className={`split-popup-button w-8 h-8 rounded-full ${settings.interlocutor.avatarColor} flex items-center justify-center font-bold text-slate-300 transition-transform hover:scale-110`}
               title={`${t('splitInto', lang)} ${t('speaker', lang)} (${settings.interlocutor.initial})`}
            >
              {settings.interlocutor.initial}
            </button>
          </div>
        )}

         {!isEditing && message.text && (
            <button 
                onClick={() => onDeleteMessage(message.id)} 
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/20 text-white/60 hover:text-white/100 hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity control-button"
                aria-label={t('deleteMessage', lang)}
            >
                <XIcon className="w-4 h-4" />
            </button>
         )}
      </div>
      
      {!isEditing && message.text && (
        <div className="absolute left-0 top-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
            <button onClick={() => onChangeSpeaker(message.id)} className={controlButtonClasses} aria-label={t('changeSpeaker', lang)}>
                <SwapIcon className="w-5 h-5" />
            </button>
             <button onClick={handleEdit} className={controlButtonClasses} aria-label={t('editMessage', lang)}>
                <EditIcon className="w-5 h-5" />
            </button>
        </div>
      )}
    </div>
  );
};

export const ChatMessage = memo(ChatMessageComponent);