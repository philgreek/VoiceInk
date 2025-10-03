import React, { useRef, useEffect, forwardRef, useState, useMemo } from 'react';
import type { Message, Settings, Entity, EntityType, Session, Citation } from '../types';
import { MicIcon, FileAudioIcon, BookmarkIcon, ClipboardIcon, ThumbsUpIcon, ThumbsDownIcon, CheckIcon } from './icons';
import { t, Language } from '../utils/translations';
import { InsightRenderer } from './InsightRenderer';

interface ChatWindowProps {
  session: Session;
  interimTranscript: string;
  isRecording: boolean;
  isProcessingFile: boolean;
  editingMessageId: string | null;
  onUpdateMessage: (id: string, newText: string) => void;
  onCancelEdit: () => void;
  lang: Language;
  playbackTime: number;
  onSeekAudio: (time: number) => void;
  onSaveToNote: (title: string, content: string, type: string) => void;
  onCitationClick: (citation: Citation) => void;
}

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
    session: Session;
    lang: Language;
    onSeekAudio: (time: number) => void;
    onUpdateMessage: (id: string, newText: string) => void;
    onCancelEdit: () => void;
}> = ({ message, settings, isActive, isEditing, session, lang, onSeekAudio, onUpdateMessage, onCancelEdit }) => {
    const profile = settings[message.sender as 'user' | 'interlocutor'];
    
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
                <InsightRenderer 
                    text={message.text} 
                    insights={session.insights || []} 
                    isInsightModeActive={session.isInsightModeActive || false} 
                    lang={lang} 
                />
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

const AssistantMessage: React.FC<{ 
    message: Message; 
    lang: Language; 
    onSaveToNote: (title: string, content: string, type: string) => void; 
    onCitationClick: (citation: Citation) => void; 
}> = ({ message, lang, onSaveToNote, onCitationClick }) => {
    const [copied, setCopied] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    
    const { answer, citations } = message;

    const handleCopy = () => {
        if (!answer) return;
        navigator.clipboard.writeText(answer).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSave = () => {
        if (!answer) return;
        const citationsText = citations?.map(c => `[${c.index}] ${c.sourceName}: "${c.fragment}"`).join('\n') || '';
        const fullContent = `${answer}\n\nCitations:\n${citationsText}`;
        onSaveToNote(answer.substring(0, 30) + '...', fullContent, 'assistantResponse');
    };
    
    const buttonClass = "p-2 rounded-md text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors flex items-center gap-2";

    const isThinking = !answer;

    const scrollToCitation = (citationIndex: number) => {
        const element = document.getElementById(`citation-${message.id}-${citationIndex}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.classList.add('animate-pulse');
        setTimeout(() => element?.classList.remove('animate-pulse'), 2000);
    };
    
    const renderAnswerWithCitations = (text: string) => {
        const parts = text.split(/(\[\d+\])/g);
        return parts.map((part, index) => {
            const match = part.match(/\[(\d+)\]/);
            if (match) {
                const citNum = parseInt(match[1], 10);
                return (
                    <button
                        key={index}
                        onClick={() => scrollToCitation(citNum)}
                        className="inline-block align-super -mt-1 mx-0.5 w-5 h-5 text-xs font-bold bg-slate-600 text-white rounded-full hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        {citNum}
                    </button>
                );
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    return (
        <div className="p-4 sm:p-6 my-2">
            <div ref={contentRef} className="p-4 bg-slate-800/50 rounded-lg">
                {isThinking ? (
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold">{t('agentThinking', lang)}</span>
                    </div>
                ) : (
                    <>
                        {/* The Sky */}
                        <div className="text-slate-300 whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                           {renderAnswerWithCitations(answer)}
                        </div>
                        
                        {/* The Ground */}
                        {citations && citations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                                <h4 className="text-xs font-bold uppercase text-slate-500">Citations</h4>
                                {citations.map((citation) => (
                                    <div key={citation.index} id={`citation-${message.id}-${citation.index}`} className="p-2 bg-slate-900/50 rounded-md transition-shadow duration-300">
                                        <button 
                                            onClick={() => onCitationClick(citation)}
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-xs font-bold bg-slate-600 text-white rounded-full">{citation.index}</span>
                                                <span className="text-sm font-semibold text-cyan-400 truncate hover:underline">{citation.sourceName}</span>
                                            </div>
                                            <blockquote className="mt-2 pl-4 border-l-2 border-slate-600 text-slate-400 text-sm italic">
                                                "{citation.fragment}"
                                            </blockquote>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
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
                    </>
                )}
            </div>
        </div>
    );
};

const TranscriptionCard: React.FC<Omit<ChatWindowProps, 'session' | 'interimTranscript' | 'isRecording' | 'isProcessingFile' | 'onSaveToNote' | 'onCitationClick'> & { messages: Message[], session: Session, onSaveToNote: (title: string, content: string, type: string) => void; }> = ({
    messages,
    session,
    editingMessageId,
    onUpdateMessage,
    onCancelEdit,
    lang,
    playbackTime,
    onSeekAudio,
    onSaveToNote,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const fullText = messages.map(msg => `${session.settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
        navigator.clipboard.writeText(fullText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const handleSave = () => {
        const fullText = messages.map(msg => `${session.settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
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
                                settings={session.settings}
                                isActive={isActive}
                                isEditing={isEditing}
                                session={session}
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
    session, 
    interimTranscript, 
    isRecording,
    isProcessingFile,
    editingMessageId,
    onUpdateMessage,
    onCancelEdit,
    lang,
    playbackTime,
    onSeekAudio,
    onSaveToNote,
    onCitationClick,
}, ref) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { messages, settings } = session;

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
                session={session}
                editingMessageId={editingMessageId}
                onUpdateMessage={onUpdateMessage}
                onCancelEdit={onCancelEdit}
                lang={lang}
                playbackTime={playbackTime}
                onSeekAudio={onSeekAudio}
                onSaveToNote={onSaveToNote}
            />
        )}
        
        {chatMessages.map((msg) => {
            if (msg.sender === 'assistant') {
                return <AssistantMessage key={msg.id} message={msg} lang={lang} onSaveToNote={onSaveToNote} onCitationClick={onCitationClick} />;
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
        {/* Spacer for floating controls */}
        <div className="h-56 flex-shrink-0" />
      </>
    );
  };

  return (
    <div className="flex-grow overflow-y-auto no-scrollbar" ref={ref} data-tour-id="chat-window">
        {renderContent()}
    </div>
  );
});