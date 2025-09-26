
import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import type { Message, Settings, Entity, EntityType, AnalysisResult } from '../types';
import { EditIcon, CheckIcon, XIcon, SparklesIcon, BookPlusIcon } from './icons';
import { t, Language } from '../utils/translations';

interface ChatMessageProps {
  message: Message;
  settings: Settings;
  onUpdateMessage: (id: string, newText: string) => void;
  onChangeSpeaker: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onStartEdit: (message: Message) => void;
  onConvertToSource: (name: string, content: string) => void;
  onMessageClick: (message: Message) => void;
  isFirstMessage: boolean;
  lang: Language;
  isActive: boolean;
  onSeekAudio: (time: number) => void;
  entities?: Entity[];
}

const entityColors: Record<EntityType, string> = {
    PERSON: 'border-b-2 border-blue-400',
    ORGANIZATION: 'border-b-2 border-yellow-400',
    DATE: 'border-b-2 border-green-400',
    LOCATION: 'border-b-2 border-pink-400',
    MONEY: 'border-b-2 border-teal-400',
    OTHER: 'border-b-2 border-gray-400',
};

const renderTextWithEntities = (text: string, entities: Entity[] | undefined, lang: Language): React.ReactNode => {
    if (!entities || entities.length === 0) {
        return <div dangerouslySetInnerHTML={{ __html: text }} />;
    }

    // This is a simplified approach. A more robust solution would use a proper parser
    // or a library to handle nested tags if the formatted text becomes complex.
    const textWithHTML = text;
    let result: (string | React.ReactNode)[] = [textWithHTML];

    entities.forEach((entity, entityIndex) => {
        let newResult: (string | React.ReactNode)[] = [];
        result.forEach((part, partIndex) => {
            if (typeof part === 'string') {
                if (!part.includes(entity.text)) {
                    newResult.push(part);
                    return;
                }

                const splitParts = part.split(entity.text);
                splitParts.forEach((textPart, i) => {
                    if (textPart) newResult.push(textPart);
                    if (i < splitParts.length - 1) {
                         newResult.push(
                            <span
                                key={`${entity.text}-${entityIndex}-${partIndex}-${i}`}
                                className={`cursor-pointer rounded-sm px-0.5 ${entityColors[entity.type]}`}
                                title={t(`entity${entity.type}` as any, lang)}
                            >
                                {entity.text}
                            </span>
                        );
                    }
                });
            } else {
                newResult.push(part);
            }
        });
        result = newResult;
    });

    return <div dangerouslySetInnerHTML={{ __html: result.map(part => typeof part === 'string' ? part : React.createElement('span', { dangerouslySetInnerHTML: { __html: part }})).join('') }} />;
};


const ChatMessageComponent: React.FC<ChatMessageProps> = ({ 
    message, settings, onUpdateMessage, onChangeSpeaker, onDeleteMessage, onStartEdit, onConvertToSource, onMessageClick, isFirstMessage, lang, isActive, onSeekAudio, entities 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const editDivRef = useRef<HTMLDivElement>(null);
  
  const handleEdit = () => {
    setIsEditing(true);
    onStartEdit(message);
  };
  
  useEffect(() => {
    if (isEditing && editDivRef.current) {
      editDivRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newText = editDivRef.current?.innerHTML || '';
    if (newText.trim() !== message.text) {
        onUpdateMessage(message.id, newText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
    }
    if (e.key === 'Escape') handleCancel();
  };

  const isUser = message.sender === 'user';
  const isAssistant = message.sender === 'assistant';

  const profile = isUser ? settings.user : (isAssistant ? settings.assistant : settings.interlocutor);
  
  const activeClasses = isActive && !isAssistant ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-main)] ring-[var(--accent-primary)]' : '';
  const bubbleClasses = `${profile.bubbleColor} ${isEditing ? 'ring-2 ring-red-500' : ''} ${activeClasses}`;
  const controlButtonClasses = "control-button p-1.5 rounded-full text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:text-white transition-all";

  const renderedContent = useMemo(() => {
      // For editing, we need raw HTML. For display, we render with entities.
      if (isEditing) {
          return null; // The contentEditable div handles it.
      }
      return renderTextWithEntities(message.text, entities, lang);
  }, [message.text, entities, lang, isEditing]);
  
  return (
    <div 
        className="flex justify-start items-start gap-3 group relative"
        onClick={() => onMessageClick(message)}
    >
      <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); if (!isAssistant) onChangeSpeaker(message.id); }}
            disabled={isAssistant}
            className={`w-10 h-10 rounded-full ${profile.avatarColor} flex items-center justify-center font-bold text-slate-300 flex-shrink-0 transition-transform ${!isAssistant ? 'hover:scale-110' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] focus:ring-white disabled:cursor-default`}
            aria-label={isAssistant ? t('assistant', lang) : t('changeSpeaker', lang)}
          >
            {isAssistant ? <SparklesIcon className="w-6 h-6" /> : profile.initial}
          </button>
      </div>
      
      <div 
        className={`relative py-3 px-4 text-white max-w-xs md:max-w-md lg:max-w-lg break-words shadow-md min-h-[4rem] rounded-lg ${!isAssistant ? 'cursor-pointer' : ''} ${bubbleClasses}`}
        onClick={() => !isAssistant && onSeekAudio(message.timestamp)}
      >
        <div 
            ref={editDivRef}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onKeyDown={handleKeyDown}
            dangerouslySetInnerHTML={{ __html: message.text }}
            className={`w-full focus:outline-none ${isEditing ? 'ring-0 p-1 -m-1 bg-black/20 rounded-md' : ''}`}
            data-message-id={message.id}
        >
        </div>
        {!isEditing && renderedContent}
        {isEditing && (
             <div className="flex justify-end gap-2 mt-2">
              <button onClick={handleSave} className="text-green-400 hover:text-green-300"> <CheckIcon className="w-5 h-5"/> </button>
              <button onClick={handleCancel} className="text-red-400 hover:text-red-300"> <XIcon className="w-5 h-5"/> </button>
            </div>
        )}
         {!isEditing && message.text && !isFirstMessage && !isAssistant && (
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
        <div className="absolute left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
             <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} className={controlButtonClasses} aria-label={t('editMessage', lang)}>
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onConvertToSource(t('chatMessage', lang), message.text); }} className={controlButtonClasses} title={t('createSource', lang)}>
                <BookPlusIcon className="w-5 h-5" />
            </button>
        </div>
      )}
      
    </div>
  );
};

export const ChatMessage = memo(ChatMessageComponent);