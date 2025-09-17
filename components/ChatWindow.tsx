

import React, { useRef, useEffect } from 'react';
import type { Message, Settings } from '../types';
import { MicIcon, FileUploadIcon } from './icons';
import { ChatMessage } from './ChatMessage';
import { t, Language } from '../utils/translations';

interface ChatWindowProps {
  messages: Message[];
  interimTranscript: string;
  currentSpeaker: 'user' | 'interlocutor';
  isRecording: boolean;
  isTranscribingFile: boolean;
  settings: Settings;
  onUpdateMessage: (id: string, newText: string) => void;
  onChangeSpeaker: (id: string) => void;
  onSplitMessage: (id: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => void;
  onDeleteMessage: (id: string) => void;
  lang: Language;
}

const MessageList: React.FC<{
  messages: Message[];
  settings: Settings;
  onUpdateMessage: (id: string, newText: string) => void;
  onChangeSpeaker: (id: string) => void;
  onSplitMessage: (id: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => void;
  onDeleteMessage: (id: string) => void;
  lang: Language;
}> = React.memo(({ messages, settings, onUpdateMessage, onChangeSpeaker, onSplitMessage, onDeleteMessage, lang }) => {
  return (
    <>
      {messages.map((msg, index) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          settings={settings}
          onUpdateMessage={onUpdateMessage}
          onChangeSpeaker={onChangeSpeaker}
          onSplitMessage={onSplitMessage}
          onDeleteMessage={onDeleteMessage}
          lang={lang}
          isFirstMessage={index === 0}
        />
      ))}
    </>
  );
});

const InterimBubble: React.FC<{ text: string, sender: 'user' | 'interlocutor', settings: Settings }> = ({ text, sender, settings }) => {
    const isUser = sender === 'user';
    const profile = isUser ? settings.user : settings.interlocutor;
    const alignment = 'justify-start';

    return (
        <div className={`flex items-end gap-3 ${alignment}`}>
            <div className={`w-10 h-10 rounded-full ${profile.avatarColor} flex items-center justify-center font-bold text-slate-300 flex-shrink-0`}>
              {profile.initial}
            </div>
            <div className={`py-3 px-4 bg-[var(--bg-surface)] text-[var(--text-secondary)] rounded-lg max-w-xs md:max-w-md lg:max-w-lg break-words opacity-70`}>
              <em>{text}</em>
            </div>
        </div>
    )
}

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-placeholder)] p-4">
        {children}
    </div>
);


export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    messages, 
    interimTranscript, 
    currentSpeaker, 
    isRecording,
    isTranscribingFile,
    settings,
    onUpdateMessage,
    onChangeSpeaker,
    onSplitMessage,
    onDeleteMessage,
    lang,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const renderContent = () => {
    if (!isRecording && messages.length === 0) {
        return (
             <Placeholder>
                <MicIcon className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{t('readyToTranscribe', lang)}</h3>
                <p>{t('pressStartToBegin', lang)}</p>
            </Placeholder>
        )
    }
    
    if (isTranscribingFile && messages.length <= 1 && messages[0]?.text.trim() === '') {
       return (
            <Placeholder>
                <div className="flex items-center gap-4">
                    <FileUploadIcon className="w-12 h-12 animate-pulse" />
                     <div>
                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">{t('transcribingFile', lang)}</h3>
                        <p>{t('thisMayTakeAMoment', lang)}</p>
                    </div>
                </div>
            </Placeholder>
        )
    }

    return (
      <div className="p-4 sm:p-6 space-y-4">
        <MessageList 
            messages={messages}
            settings={settings}
            onUpdateMessage={onUpdateMessage}
            onChangeSpeaker={onChangeSpeaker}
            onSplitMessage={onSplitMessage}
            onDeleteMessage={onDeleteMessage}
            lang={lang}
        />
        {interimTranscript && (
          <InterimBubble text={interimTranscript} sender={currentSpeaker} settings={settings} />
        )}
        <div ref={endOfMessagesRef} />
      </div>
    );
  };

  return (
    <div className="flex-grow overflow-y-auto no-scrollbar">
        {renderContent()}
    </div>
  );
};