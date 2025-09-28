
import React, { useRef, useEffect, forwardRef, useState, useMemo } from 'react';
import type { Message, Settings, Entity, EntityType } from '../types';
import { MicIcon, FileAudioIcon, BookmarkIcon, ClipboardIcon, ThumbsUpIcon, ThumbsDownIcon, CheckIcon } from './icons';
import { t, Language } from '../utils/translations';

interface ChatWindowProps {
  messages: Message[];
  interimTranscript: string;
  isRecording: boolean;
  isProcessingFile: boolean;
  settings: Settings;
  editingMessageId: string | null;
  onUpdateMessage: (id: string, newText: string) => void;
  onCancelEdit: () => void;
  lang: Language;
  playbackTime: number;
  onSeekAudio: (time: number) => void;
  onSaveToNote: (title: string, content: string, type: string) => void;
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
        return text;
    }

    const sortedEntities = [...entities]
        .filter(e => text.includes(e.text))
        .sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];

    sortedEntities.forEach((entity, i) => {
        const startIndex = text.indexOf(entity.text, lastIndex);
        if (startIndex === -1) return;

        if (startIndex > lastIndex) {
            parts.push(text.substring(lastIndex, startIndex));
        }

        parts.push(
            <span
                key={`${entity.text}-${i}`}
                className={`cursor-pointer rounded-sm px-0.5 ${entityColors[entity.type]}`}
                title={t(`entity${entity.type}` as any, lang)}
            >
                {entity.text}
            </span>
        );

        lastIndex = startIndex + entity.text.length;
    });

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts;
};


const EditableMessage: React.FC<{
    message: Message;
    onSave: (text: string) => void;
    onCancel: () => void;
}> = ({ message, onSave, onCancel }) => {
    const [editText, setEditText] = useState(message.text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, []);

    const handleSave = () => {
        onSave(editText.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') onCancel();
    };

    return (
        <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full bg-slate-800 border border-slate-600 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            rows={1}
        />
    );
};

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-placeholder)] p-4">
        {children}
    </div>
);

const MessageRow: React.FC<{
    message: Message;
    settings: Settings;
    isActive: boolean;
    isEditing: boolean;
    entities: Entity[] | undefined;
    lang: Language;
    onSeekAudio: (time: number) => void;
    onUpdateMessage: (id: string, newText: string) => void;
    onCancelEdit: () => void;
}> = ({ message, settings, isActive, isEditing, entities, lang, onSeekAudio, onUpdateMessage, onCancelEdit }) => {
    const profile = settings[message.sender as 'user' | 'interlocutor'];
    
    const renderedContent = useMemo(() => renderTextWithEntities(message.text, entities, lang), [message.text, entities, lang]);
    
    return (
        <div data-message-id={message.id} className={`flex gap-3 p-1 rounded-md ${isActive ? 'bg-slate-800/50' : ''}`}>
           <strong 
             className="w-12 text-right flex-shrink-0 font-sans text-base font-bold text-slate-400 select-none cursor-pointer"
             onClick={() => onSeekAudio(message.timestamp)}
           >
               {profile.initial}:
           </strong>
           <div className="flex-grow">
             {isEditing ? (
                 <EditableMessage 
                   message={message}
                   onSave={(text) => onUpdateMessage(message.id, text)}
                   onCancel={onCancelEdit}
                 />
             ) : (
                 <p>{renderedContent}</p>
             )}
           </div>
        </div>
    );
};

const UserQueryMessage: React.FC<{ message: Message; settings: Settings }> = ({ message, settings }) => {
    return (
        <div className="flex justify-end my-2 px-4 sm:px-6">
            <div className="max-w-xl bg-blue-600 text-white p-3 rounded-lg rounded-br-none shadow-md">
                <p>{message.text}</p>
            </div>
        </div>
    );
};

const AssistantMessage: React.FC<{ message: Message; settings: Settings; lang: Language; onSaveToNote: (title: string, content: string, type: string) => void; }> = ({ message, lang, onSaveToNote }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(message.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const buttonClass = "p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors flex items-center gap-2";

    return (
        <div className="p-4 sm:p-6 my-2">
            <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-slate-300 whitespace-pre-wrap prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2">
                    <button className={buttonClass} onClick={() => onSaveToNote(message.text.substring(0, 30) + '...', message.text, 'assistantResponse')}>
                        <BookmarkIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{t('saveToNote', lang)}</span>
                    </button>
                    <button onClick={handleCopy} className={buttonClass} title={t('copy', lang)}>
                        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                    </button>
                    <div className="flex-grow" />
                    <button className={buttonClass} title={t('goodResponse', lang)}>
                        <ThumbsUpIcon className="w-4 h-4" />
                    </button>
                    <button className={buttonClass} title={t('badResponse', lang)}>
                        <ThumbsDownIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const TranscriptionCard: React.FC<Omit<ChatWindowProps, 'messages' | 'interimTranscript' | 'isRecording' | 'isProcessingFile' | 'onSaveToNote'> & { messages: Message[], onSaveToNote: (title: string, content: string, type: string) => void; }> = ({
    messages,
    settings,
    editingMessageId,
    onUpdateMessage,
    onCancelEdit,
    lang,
    playbackTime,
    onSeekAudio,
    entities,
    onSaveToNote,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const fullText = messages.map(msg => `${settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
        navigator.clipboard.writeText(fullText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const handleSave = () => {
        const fullText = messages.map(msg => `${settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
        onSaveToNote(t('transcription', lang), fullText, 'transcription');
    };

    const buttonClass = "p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors flex items-center gap-2";

    return (
        <div className="p-4 sm:p-6 my-2">
            <div className="p-4 bg-slate-800/50 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-400 mb-4">{t('transcription', lang)}</h3>
                <div className="font-serif text-lg leading-relaxed space-y-2">
                    {messages.map((msg) => {
                        const nextMsg = messages.find(m => m.timestamp > msg.timestamp);
                        const isActive = playbackTime >= msg.timestamp && (!nextMsg || playbackTime < nextMsg.timestamp);
                        const isEditing = editingMessageId === msg.id;
                        
                        return (
                            <MessageRow
                                key={msg.id}
                                message={msg}
                                settings={settings}
                                isActive={isActive}
                                isEditing={isEditing}
                                entities={entities}
                                lang={lang}
                                onSeekAudio={onSeekAudio}
                                onUpdateMessage={onUpdateMessage}
                                onCancelEdit={onCancelEdit}
                            />
                        );
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2">
                    <button className={buttonClass} onClick={handleSave}>
                        <BookmarkIcon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{t('saveToNote', lang)}</span>
                    </button>
                    <button onClick={handleCopy} className={buttonClass} title={t('copy', lang)}>
                        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                    </button>
                    <div className="flex-grow" />
                    <button className={buttonClass} title={t('goodResponse', lang)}>
                        <ThumbsUpIcon className="w-4 h-4" />
                    </button>
                    <button className={buttonClass} title={t('badResponse', lang)}>
                        <ThumbsDownIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({ 
    messages, 
    interimTranscript, 
    isRecording,
    isProcessingFile,
    settings,
    editingMessageId,
    onUpdateMessage,
    onCancelEdit,
    lang,
    playbackTime,
    onSeekAudio,
    onSaveToNote,
    entities,
}, ref) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const renderContent = () => {
    if (isProcessingFile) {
       return (
            <Placeholder>
                <div className="flex items-center gap-4">
                    <FileAudioIcon className="w-12 h-12 animate-pulse text-[var(--accent-primary)]" />
                     <div>
                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">{t('processingSource', lang)}</h3>
                        <p>{t('thisMayTakeAMoment', lang)}</p>
                    </div>
                </div>
            </Placeholder>
        )
    }
      
    if (!isRecording && messages.length === 0) {
        return (
             <Placeholder>
                <MicIcon className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{t('readyToTranscribe', lang)}</h3>
                <p>{t('pressStartToBegin', lang)}</p>
            </Placeholder>
        )
    }

    const transcriptionMessages = messages.filter(msg => msg.timestamp !== -1);
    const chatMessages = messages.filter(msg => msg.timestamp === -1);
    
    return (
      <>
        {transcriptionMessages.length > 0 && (
            <TranscriptionCard
                messages={transcriptionMessages}
                settings={settings}
                editingMessageId={editingMessageId}
                onUpdateMessage={onUpdateMessage}
                onCancelEdit={onCancelEdit}
                lang={lang}
                playbackTime={playbackTime}
                onSeekAudio={onSeekAudio}
                entities={entities}
                onSaveToNote={onSaveToNote}
            />
        )}
        
        {chatMessages.map((msg) => {
            if (msg.sender === 'assistant') {
                return <AssistantMessage key={msg.id} message={msg} settings={settings} lang={lang} onSaveToNote={onSaveToNote} />;
            } else { 
                return <UserQueryMessage key={msg.id} message={msg} settings={settings} />;
            }
        })}

        {interimTranscript && (
            <div className="px-4 sm:px-6">
                <div className="flex gap-3 p-1">
                    <strong className="w-12 text-right flex-shrink-0 font-sans text-base font-bold text-slate-500">
                        {settings[isRecording && !interimTranscript.startsWith(settings.user.initial) ? 'interlocutor' : 'user'].initial}:
                    </strong>
                    <p className="flex-grow text-slate-500 italic">{interimTranscript}</p>
                </div>
            </div>
        )}
        <div ref={endOfMessagesRef} />
      </>
    );
  };

  return (
    <div className="flex-grow overflow-y-auto no-scrollbar" ref={ref} data-tour-id="chat-window">
        {renderContent()}
    </div>
  );
});
