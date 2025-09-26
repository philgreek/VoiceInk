

import React, { useRef, useEffect, forwardRef } from 'react';
import type { Message, Settings, Entity } from '../types';
import { MicIcon, FileAudioIcon } from './icons';
import { ChatMessage } from './ChatMessage';
import { t, Language } from '../utils/translations';

interface ChatWindowProps {
  messages: Message[];
  interimTranscript: string;
  currentSpeaker: 'user' | 'interlocutor';
  isRecording: boolean;
  isPaused: boolean;
  isProcessingFile: boolean;
  settings: Settings;
  onUpdateMessage: (id: string, newText: string) => void;
  onChangeSpeaker: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onStartEdit: (message: Message) => void;
  onConvertToSource: (name: string, content: string) => void;
  onMessageClick: (message: Message) => void;
  lang: Language;
  playbackTime: number;
  onSeekAudio: (time: number) => void;
  entities?: Entity[];
}

const MessageList: React.FC<Omit<ChatWindowProps, 'interimTranscript' | 'currentSpeaker' | 'isRecording' | 'isPaused' | 'isProcessingFile'>> = React.memo(({ messages, settings, onUpdateMessage, onChangeSpeaker, onDeleteMessage, onStartEdit, onConvertToSource, onMessageClick, lang, playbackTime, onSeekAudio, entities }) => {
  return (
    <>
      {messages.map((msg, index) => {
        const nextMsg = messages[index + 1];
        const isActive = playbackTime >= msg.timestamp && (!nextMsg || playbackTime < nextMsg.timestamp);

        return (
            <ChatMessage
              key={msg.id}
              message={msg}
              settings={settings}
              onUpdateMessage={onUpdateMessage}
              onChangeSpeaker={onChangeSpeaker}
              onDeleteMessage={onDeleteMessage}
              onStartEdit={onStartEdit}
              onConvertToSource={onConvertToSource}
              onMessageClick={onMessageClick}
              isFirstMessage={index === 0}
              lang={lang}
              isActive={isActive}
              onSeekAudio={onSeekAudio}
              entities={entities}
            />
        );
      })}
    </>
  );
});

const InterimBubble: React.FC<{ text: string, sender: 'user' | 'interlocutor', settings: Settings }> = ({ text, sender, settings }) => {
    const isUser = sender === 'user';
    const profile = isUser ? settings.user : settings.interlocutor;
    return (
        <div className="flex items-end gap-3 justify-start">
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


export const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({ 
    messages, 
    interimTranscript, 
    currentSpeaker, 
    isRecording,
    isPaused,
    isProcessingFile,
    settings,
    onUpdateMessage,
    onChangeSpeaker,
    onDeleteMessage,
    onStartEdit,
    onConvertToSource,
    onMessageClick,
    lang,
    playbackTime,
    onSeekAudio,
    entities,
}, ref) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimTranscript, isRecording, isPaused]);

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

    return (
      <div className="p-4 sm:p-6 space-y-4">
        <MessageList 
            messages={messages}
            settings={settings}
            onUpdateMessage={onUpdateMessage}
            onChangeSpeaker={onChangeSpeaker}
            onDeleteMessage={onDeleteMessage}
            onStartEdit={onStartEdit}
            onConvertToSource={onConvertToSource}
            onMessageClick={onMessageClick}
            lang={lang}
            playbackTime={playbackTime}
            onSeekAudio={onSeekAudio}
            entities={entities}
        />
        {interimTranscript && (
          <InterimBubble text={interimTranscript} sender={currentSpeaker} settings={settings} />
        )}
        <div ref={endOfMessagesRef} />
      </div>
    );
  };

  return (
    <div className="flex-grow overflow-y-auto no-scrollbar" ref={ref} data-tour-id="chat-window">
        {renderContent()}
    </div>
  );
});