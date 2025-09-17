

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscription } from './hooks/useTranscription';
import { Message, Settings } from './types';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { TranscriptionControls } from './components/TranscriptionControls';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { SourceSelectionModal } from './components/SourceSelectionModal';
import { FileInstructionsModal } from './components/FileInstructionsModal';
import { produce } from 'immer';
import { t, Language } from './utils/translations';
import { useHistoryState } from './hooks/useHistoryState';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const defaultSettings: Settings = {
  user: {
    initial: 'Y',
    bubbleColor: 'bg-cyan-600',
    avatarColor: 'bg-cyan-800',
  },
  interlocutor: {
    initial: 'S',
    bubbleColor: 'bg-slate-700',
    avatarColor: 'bg-slate-600',
  },
  theme: 'dark',
  language: 'ru',
};


const App: React.FC = () => {
  const { 
    state: messages, 
    setState: setMessages, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    reset: resetMessages 
  } = useHistoryState<Message[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribingFile, setIsTranscribingFile] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'interlocutor'>('interlocutor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showFileInstructionsModal, setShowFileInstructionsModal] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const streamAudioRef = useRef<HTMLAudioElement>(null);
  const fileAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('voiceInkSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error("Failed to parse settings from localStorage", error);
      return defaultSettings;
    }
  });

  const lang = settings.language as Language;

  const { startListening, stopListening, finalTranscript, interimTranscript, resetFinalTranscript, restartListening } = useTranscription({ lang });

  useEffect(() => {
    try {
      localStorage.setItem('voiceInkSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  // Centralized control for speech recognition
  useEffect(() => {
    if (isRecording && !isPaused) {
      startListening();
    } else {
      stopListening();
    }
  }, [isRecording, isPaused, startListening, stopListening]);

  const stopMediaStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      if(streamAudioRef.current) {
        streamAudioRef.current.srcObject = null;
      }
    }
  }, [mediaStream]);

  const stopTranscriptionSession = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    setIsTranscribingFile(false);
    setIsPushToTalkActive(false);
    setAudioFile(null);
    if (fileAudioRef.current) {
      fileAudioRef.current.pause();
      fileAudioRef.current.src = "";
    }
    stopMediaStream();
  }, [stopMediaStream]);

  const startTranscriptionSession = () => {
    resetMessages([]);
    setIsRecording(true);
    setIsPaused(false);
    setCurrentSpeaker('interlocutor');
    setIsPushToTalkActive(false);
  };
  
  const handleSourceSelected = async (source: 'microphone' | 'display') => {
      setShowSourceModal(false);
      if (source === 'microphone') {
          startTranscriptionSession();
      } else {
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({
                  video: true,
                  audio: {
                      echoCancellation: false,
                      noiseSuppression: false,
                      autoGainControl: false,
                  },
              });

              const audioTrack = stream.getAudioTracks()[0];
              if (!audioTrack) {
                  alert(t('noAudioTrackError', lang));
                  stream.getTracks().forEach(track => track.stop());
                  return;
              }
              
              audioTrack.onended = () => {
                  stopTranscriptionSession();
              };

              setMediaStream(stream);
              if (streamAudioRef.current) {
                streamAudioRef.current.srcObject = stream;
              }
              startTranscriptionSession();
          } catch (err) {
              console.error("Error starting display media:", err);
              if ((err as DOMException).name !== 'NotAllowedError') {
                 alert(t('screenShareError', lang));
              }
          }
      }
  };

  const handleFileSelectClick = () => {
    setShowSourceModal(false);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setShowFileInstructionsModal(true);
    }
     if(event.target) {
        event.target.value = '';
    }
  };

  const handleStartFileTranscriptionFlow = () => {
    setShowFileInstructionsModal(false);
    startFileTranscription();
  };

  const handleCancelFileTranscriptionFlow = () => {
    setShowFileInstructionsModal(false);
    setAudioFile(null);
  };

  const startFileTranscription = useCallback(async () => {
    if (!audioFile) return;

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
        });

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
            alert(t('audioTrackNotSharedError', lang));
            stream.getTracks().forEach(track => track.stop());
            setAudioFile(null);
            return;
        }

        audioTrack.onended = () => {
            stopTranscriptionSession();
        };

        setMediaStream(stream);
        setIsTranscribingFile(true);
        startTranscriptionSession();

        if (fileAudioRef.current) {
            fileAudioRef.current.src = URL.createObjectURL(audioFile);
            fileAudioRef.current.play();
        }

    } catch (err) {
        console.error("Error starting display media for file transcription:", err);
        setAudioFile(null);
        if ((err as DOMException).name !== 'NotAllowedError') {
            alert(t('screenShareError', lang));
        }
    }
  }, [audioFile, stopTranscriptionSession, lang]);


  const handleStartStopClick = useCallback(() => {
    if (isRecording) {
      if (isPaused) {
        setIsPaused(false);
      } else {
        stopTranscriptionSession();
      }
    } else {
      setShowSourceModal(true);
    }
  }, [isRecording, isPaused, stopTranscriptionSession]);

  const handlePause = useCallback(() => {
    if (isRecording && !isTranscribingFile) {
      setIsPaused(prev => !prev);
    }
  }, [isRecording, isTranscribingFile]);

  const handleMicToggle = useCallback(() => {
    if (!isRecording || isPaused || isTranscribingFile) return;

    const newPttState = !isPushToTalkActive;
    setIsPushToTalkActive(newPttState);
    setCurrentSpeaker(newPttState ? 'user' : 'interlocutor');
    // Use the new safe restart function from the hook
    restartListening();
  }, [isRecording, isPaused, isTranscribingFile, isPushToTalkActive, restartListening]);

  useEffect(() => {
    if (finalTranscript) {
      setMessages(produce(draft => {
        const lastMessage = draft.length > 0 ? draft[draft.length - 1] : null;
        if (lastMessage && lastMessage.sender === currentSpeaker) {
          lastMessage.text = (lastMessage.text + ' ' + finalTranscript).trim();
        } else {
          draft.push({
            id: `msg-${Date.now()}`,
            text: finalTranscript,
            timestamp: Date.now(),
            sender: currentSpeaker,
          });
        }
      }));
      resetFinalTranscript();
    }
  }, [finalTranscript, currentSpeaker, setMessages, resetFinalTranscript]);

  const handleClear = () => {
      if (window.confirm(t('clearChatConfirmation', lang))) {
          resetMessages([]);
      }
  };

  const handleUpdateMessage = useCallback((id: string, newText: string) => {
    setMessages(produce(draft => {
      const msg = draft.find(m => m.id === id);
      if (msg) {
        msg.text = newText;
      }
    }));
  }, [setMessages]);

  const handleChangeSpeaker = useCallback((id: string) => {
    setMessages(produce(draft => {
      const msg = draft.find(m => m.id === id);
      if (msg) {
        msg.sender = msg.sender === 'user' ? 'interlocutor' : 'user';
      }
    }));
  }, [setMessages]);
  
  const handleSplitMessage = useCallback((messageId: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => {
    setMessages(produce(draft => {
      const originalMessageIndex = draft.findIndex(m => m.id === messageId);
      if (originalMessageIndex === -1) return;

      const originalMessage = draft[originalMessageIndex];
      const originalText = originalMessage.text;
      const startIndex = originalText.indexOf(selectedText);

      if (startIndex === -1) return;

      const textBefore = originalText.substring(0, startIndex).trim();
      const textAfter = originalText.substring(startIndex + selectedText.length).trim();
      
      const messagesToInsert: Message[] = [];
      let currentTime = originalMessage.timestamp;
      
      // Keep original message if there's text before, otherwise it will be replaced.
      if (textBefore) {
        originalMessage.text = textBefore;
        messagesToInsert.push({
          id: `msg-${Date.now()}`,
          text: selectedText,
          sender: newSpeaker,
          timestamp: currentTime + 1,
        });
        if (textAfter) {
           messagesToInsert.push({
            id: `msg-${Date.now() + 1}`,
            text: textAfter,
            sender: originalMessage.sender,
            timestamp: currentTime + 2,
          });
        }
        draft.splice(originalMessageIndex + 1, 0, ...messagesToInsert);
      } else {
        // Text was selected from the beginning
        originalMessage.text = selectedText;
        originalMessage.sender = newSpeaker;
        if (textAfter) {
          messagesToInsert.push({
            id: `msg-${Date.now() + 1}`,
            text: textAfter,
            sender: newSpeaker === 'user' ? 'interlocutor' : 'user', // Opposite of the original speaker
            timestamp: currentTime + 1
          });
           draft.splice(originalMessageIndex + 1, 0, ...messagesToInsert);
        }
      }
    }));
  }, [setMessages]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages(produce(draft => {
      const indexToDelete = draft.findIndex(m => m.id === messageId);
      if (indexToDelete === -1) return;

      if (indexToDelete === 0) {
        draft.splice(indexToDelete, 1);
        return;
      }

      const messageToDelete = draft[indexToDelete];
      const previousMessage = draft[indexToDelete - 1];

      previousMessage.text = (previousMessage.text + ' ' + messageToDelete.text).trim();
      draft.splice(indexToDelete, 1);
    }));
  }, [setMessages]);

  const formatChatForExport = () => {
    return messages
      .filter(msg => msg.text.trim() !== '')
      .map(msg => {
        const speakerLabel = msg.sender === 'user' ? settings.user.initial : settings.interlocutor.initial;
        const speaker = msg.sender === 'user' ? `${t('you', lang)} (${speakerLabel})` : `${t('speaker', lang)} (${speakerLabel})`;
        const time = new Date(msg.timestamp).toLocaleTimeString();
        return `[${time}] ${speaker}: ${msg.text}`;
      })
      .join('\n');
  };

  const handleSaveAsTxt = () => {
    const text = formatChatForExport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceink-chat-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };
  
  const handleSaveAsPdf = () => {
      const doc = new jsPDF();
      let y = 15;
      const leftMargin = 10;
      const rightMargin = 10;
      const bubblePadding = 3;
      const avatarSize = 8;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - leftMargin - rightMargin - avatarSize - 10;

      messages.forEach(msg => {
          if (msg.text.trim() === '') return;

          const isUser = msg.sender === 'user';
          const profile = isUser ? settings.user : settings.interlocutor;
          const text = msg.text;
          const lines = doc.splitTextToSize(text, maxLineWidth);
          const bubbleHeight = (lines.length * 5) + (bubblePadding * 2);

          if (y + bubbleHeight > pageHeight - 15) {
              doc.addPage();
              y = 15;
          }
          
          // Avatar Color
          const avatarColor = isUser ? '#0e7490' : '#475569'; // cyan-800 vs slate-600
          doc.setFillColor(avatarColor);
          doc.circle(leftMargin + (avatarSize / 2), y, avatarSize / 2, 'F');
          
          // Bubble Color
          const bubbleColor = isUser ? '#06b6d4' : '#334155'; // cyan-500 vs slate-700
          doc.setFillColor(bubbleColor);
          doc.roundedRect(leftMargin + avatarSize + 2, y - (avatarSize/2) + 1, doc.getStringUnitWidth(lines.join('\n')) * 2.6 + (bubblePadding * 2) , bubbleHeight, 3, 3, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.text(lines, leftMargin + avatarSize + 2 + bubblePadding, y + 2);
          
          y += bubbleHeight + 8;
      });

      doc.save(`voiceink-chat-${new Date().toISOString()}.pdf`);
      setShowExportModal(false);
  };

  const handleSaveAsDocx = async () => {
      const doc = new Document({
        sections: [{
            children: messages.map(msg => {
                if (msg.text.trim() === '') return null;
                const speakerLabel = msg.sender === 'user' ? `${t('you', lang)} (${settings.user.initial})` : `${t('speaker', lang)} (${settings.interlocutor.initial})`;
                return new Paragraph({
                    children: [
                        new TextRun({ text: `${speakerLabel}: `, bold: true }),
                        new TextRun(msg.text),
                    ],
                });
            }).filter(Boolean) as Paragraph[],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voiceink-chat-${new Date().toISOString()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
  };


  const handleCopyToClipboard = () => {
    const text = formatChatForExport();
    navigator.clipboard.writeText(text).then(() => {
      alert(t('copySuccess', lang));
      setShowExportModal(false);
    }).catch(err => {
      console.error('Failed to copy chat: ', err);
      alert(t('copyFail', lang));
    });
  };
  
  const handleSendToApp = async () => {
    const text = formatChatForExport();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VoiceInk Chat Log',
          text: text,
        });
        setShowExportModal(false);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert(t('shareFail', lang));
    }
  };

  useEffect(() => {
    const body = document.body;
    body.className = '';
    body.classList.add(`theme-${settings.theme}`);
  }, [settings.theme]);


  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      <Header 
        onExport={() => setShowExportModal(true)} 
        onClear={handleClear} 
        onSettings={() => setShowSettingsModal(true)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        lang={lang}
      />
      <audio ref={streamAudioRef} muted autoPlay playsInline className="hidden"></audio>
      <audio ref={fileAudioRef} onEnded={stopTranscriptionSession} className="hidden"></audio>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelected} 
        accept="audio/*" 
        className="hidden" 
      />

      <main className="flex-grow flex flex-col min-h-0">
        <ChatWindow
            messages={messages}
            interimTranscript={interimTranscript}
            currentSpeaker={currentSpeaker}
            isRecording={isRecording}
            isTranscribingFile={isTranscribingFile}
            settings={settings}
            onUpdateMessage={handleUpdateMessage}
            onChangeSpeaker={handleChangeSpeaker}
            onSplitMessage={handleSplitMessage}
            onDeleteMessage={handleDeleteMessage}
            lang={lang}
        />
        <TranscriptionControls
            isRecording={isRecording}
            isPaused={isPaused}
            isPushToTalkActive={isPushToTalkActive}
            isTranscribingFile={isTranscribingFile}
            onStartStopClick={handleStartStopClick}
            onPause={handlePause}
            onMicToggle={handleMicToggle}
            lang={lang}
        />
      </main>

       {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onSaveAsTxt={handleSaveAsTxt}
          onSaveAsPdf={handleSaveAsPdf}
          onSaveAsDocx={handleSaveAsDocx}
          onCopyToClipboard={handleCopyToClipboard}
          onSendToApp={handleSendToApp}
          lang={lang}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={(newSettings) => {
            setSettings(newSettings);
            setShowSettingsModal(false);
          }}
          lang={lang}
        />
      )}
      {showSourceModal && (
        <SourceSelectionModal
          onClose={() => setShowSourceModal(false)}
          onSelectSource={handleSourceSelected}
          onFileSelectClick={handleFileSelectClick}
          lang={lang}
        />
      )}
      {showFileInstructionsModal && audioFile && (
        <FileInstructionsModal
          fileName={audioFile.name}
          onClose={handleCancelFileTranscriptionFlow}
          onConfirm={handleStartFileTranscriptionFlow}
          lang={lang}
        />
      )}
    </div>
  );
};

export default App;