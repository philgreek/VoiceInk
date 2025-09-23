
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscription } from './hooks/useTranscription';
import { Message, Session, Settings, LoadedSession, SelectionContext, AnalysisResult, ActionItem } from './types';
import { Header } from './components/Header';
import { SessionBar } from './components/SessionBar';
import { ChatWindow } from './components/ChatWindow';
import { TranscriptionControls } from './components/TranscriptionControls';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { SourceSelectionModal } from './components/SourceSelectionModal';
import { FileInstructionsModal } from './components/FileInstructionsModal';
import { SessionNameModal } from './components/SessionNameModal';
import { HistoryModal } from './components/HistoryModal';
import { ContextualActionBar } from './components/ContextualActionBar';
import { InsightsPanel } from './components/InsightsPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { produce } from 'immer';
import { t, Language } from './utils/translations';
import { useHistoryState } from './hooks/useHistoryState';
import { useSessionHistory } from './hooks/useSessionHistory';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import html2canvas from 'html2canvas';
import { AudioPlayer } from './components/AudioPlayer';
import introJs from 'intro.js';
import { getSummary, getActionItems, getKeyTopics } from './utils/gemini';

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
  assistant: {
    initial: 'AI',
    bubbleColor: 'bg-gradient-to-br from-purple-600 to-indigo-600',
    avatarColor: 'bg-purple-800',
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
  const [showSessionNameModal, setShowSessionNameModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [loadedSession, setLoadedSession] = useState<LoadedSession | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState({ summary: false, actionItems: false, topics: false });
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const { sessions, saveSession, deleteSession, getSessionAudio, updateSessionAnalysis } = useSessionHistory();

  const streamAudioRef = useRef<HTMLAudioElement>(null);
  const fileAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const recordingStartTimeRef = useRef<number>(0);
  
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
  
  useEffect(() => {
    const key = sessionStorage.getItem('geminiApiKey');
    if (key) {
      setGeminiApiKey(key);
    }
  }, []);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob | null) => {
    if (messages.length > 0 && sessionName) {
        const newSession = await saveSession({ 
            name: sessionName, 
            messages, 
            settings, 
            hasAudio: !!audioBlob,
            analysisResult: null,
        }, audioBlob);
        setLoadedSession({ ...newSession, audioBlob });
    }
  }, [messages, sessionName, settings, saveSession]);

  const handleFinalTranscript = useCallback((transcript: string) => {
    if (!transcript) return;
    
    setMessages(currentMessages => produce(currentMessages, draft => {
      const lastMessage = draft.length > 0 ? draft[draft.length - 1] : null;
      const speaker = isPushToTalkActive ? 'user' : 'interlocutor';

      if (lastMessage && lastMessage.sender === speaker) {
        lastMessage.text = (lastMessage.text + ' ' + transcript).trim();
      } else {
        draft.push({
          id: `msg-${Date.now()}`,
          text: transcript,
          timestamp: (Date.now() - recordingStartTimeRef.current) / 1000,
          sender: speaker,
        });
      }
    }));
  }, [setMessages, isPushToTalkActive]);

  const { startListening, stopListening, interimTranscript, restartListening } = useTranscription({ 
    lang,
    onFinalTranscript: handleFinalTranscript,
    onRecordingComplete: handleRecordingComplete,
    mediaStream,
  });

  const startTour = useCallback(() => {
    const tour = introJs();
    tour.setOptions({
      steps: [
        { title: t('tourWelcomeTitle', lang), intro: t('tourWelcomeBody', lang) },
        { element: '[data-tour-id="history-btn"]', title: t('tourHistoryTitle', lang), intro: t('tourHistoryBody', lang) },
        { element: '[data-tour-id="header-controls"]', title: t('tourControlsTitle', lang), intro: t('tourControlsBody', lang) },
        { element: '[data-tour-id="chat-window"]', title: t('tourChatWindowTitle', lang), intro: t('tourChatWindowBody', lang) },
        { element: '[data-tour-id="transcription-controls"]', title: t('tourTranscriptionControlsTitle', lang), intro: t('tourTranscriptionControlsBody', lang) },
        { element: '[data-tour-id="chat-window"]', title: t('tourEditingTitle', lang), intro: t('tourEditingBody', lang) },
      ],
      nextLabel: t('next', lang),
      prevLabel: t('prev', lang),
      doneLabel: t('done', lang),
      exitOnOverlayClick: false,
      showProgress: true,
    });

    tour.onchange(function() {
      const tooltip = document.querySelector('.introjs-tooltip');
      if (!tooltip) return;
      
      const currentStepIndex = this.currentStep();
      if (currentStepIndex === 3 || currentStepIndex === 5) {
        tooltip.classList.add('introjs-tooltip-glow');
      } else {
        tooltip.classList.remove('introjs-tooltip-glow');
      }
    });

    tour.onexit(function() {
      const tooltip = document.querySelector('.introjs-tooltip');
      tooltip?.classList.remove('introjs-tooltip-glow');
    });

    tour.start();
  }, [lang]);

  useEffect(() => {
    const tutorialShown = localStorage.getItem('voiceink_tutorial_shown');
    if (!tutorialShown) {
      setTimeout(() => {
        startTour();
        localStorage.setItem('voiceink_tutorial_shown', 'true');
      }, 500);
    }
  }, [startTour]);
  
  useEffect(() => {
    const handleSelectionChange = () => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText) {
            const anchorNode = selection.anchorNode;
            if (anchorNode && anchorNode.parentElement) {
                const messageElement = anchorNode.parentElement.closest('[data-message-id]');
                if (messageElement) {
                    const messageId = messageElement.getAttribute('data-message-id');
                    if(messageId) {
                        setSelectionContext({ messageId, text: selectedText });
                        return;
                    }
                }
            }
        }
        setSelectionContext(null);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('voiceInkSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      startListening();
    } else {
      stopListening();
    }
  }, [isRecording, isPaused, startListening, stopListening]);
  
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRecording) {
        event.preventDefault();
        event.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRecording]);

  useEffect(() => {
    setAnalysisResult(loadedSession?.analysisResult || null);
  }, [loadedSession]);

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

 const handleStopClick = () => {
    stopTranscriptionSession();
    // Keep loaded session active for analysis
  };

  const startRecordingFlow = (name: string) => {
    setSessionName(name);
    setIsRecording(true);
    setIsPaused(false);
    setCurrentSpeaker('interlocutor');
    setIsPushToTalkActive(false);
    recordingStartTimeRef.current = Date.now();
  };

  const handleSessionNameConfirmed = (name: string) => {
    setShowSessionNameModal(false);
    startRecordingFlow(name);
  };
  
  const handleSourceSelected = async (source: 'microphone' | 'display') => {
      setShowSourceModal(false);
      const constraints = source === 'microphone' 
        ? { audio: true } 
        : { video: true, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } };
      
      try {
        const stream = source === 'microphone' 
          ? await navigator.mediaDevices.getUserMedia(constraints)
          : await navigator.mediaDevices.getDisplayMedia(constraints);

        if(source === 'display') {
            const audioTrack = stream.getAudioTracks()[0];
             if (!audioTrack) {
                alert(t('noAudioTrackError', lang));
                stream.getTracks().forEach(track => track.stop());
                return;
            }
             audioTrack.onended = () => stopTranscriptionSession();
        }
        
        setMediaStream(stream);
        if (streamAudioRef.current) {
            streamAudioRef.current.srcObject = stream;
        }
        setShowSessionNameModal(true);
      } catch (err) {
        console.error(`Error starting ${source} media:`, err);
        if ((err as DOMException).name !== 'NotAllowedError') {
           alert(t('screenShareError', lang));
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

  const handleStartFileTranscriptionFlow = async () => {
    setShowFileInstructionsModal(false);
    if (!audioFile) return;

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
            alert(t('audioTrackNotSharedError', lang));
            stream.getTracks().forEach(track => track.stop());
            setAudioFile(null);
            return;
        }

        audioTrack.onended = () => stopTranscriptionSession();
        setMediaStream(stream);
        setIsTranscribingFile(true);

        if (fileAudioRef.current) {
            fileAudioRef.current.src = URL.createObjectURL(audioFile);
            fileAudioRef.current.play();
        }
        setShowSessionNameModal(true);
    } catch (err) {
        console.error("Error starting display media for file transcription:", err);
        setAudioFile(null);
        if ((err as DOMException).name !== 'NotAllowedError') {
            alert(t('screenShareError', lang));
        }
    }
  };

  const handleCancelFileTranscriptionFlow = () => {
    setShowFileInstructionsModal(false);
    setAudioFile(null);
  };

  const handleStartClick = () => {
    if (loadedSession) { 
      if(window.confirm(t('startNewSessionConfirmation', lang))) {
        resetMessages([]);
        setLoadedSession(null);
        setAnalysisResult(null);
        setShowSourceModal(true);
      }
    } else { // Start a brand new session
      resetMessages([]);
      setLoadedSession(null);
      setAnalysisResult(null);
      setShowSourceModal(true);
    }
  };

  const handlePauseClick = () => {
    if (isRecording && !isTranscribingFile) {
      setIsPaused(prev => !prev);
    }
  };

  const handleMicToggle = useCallback(() => {
    if (!isRecording || isPaused || isTranscribingFile) return;

    const newPttState = !isPushToTalkActive;
    setIsPushToTalkActive(newPttState);
    setCurrentSpeaker(newPttState ? 'user' : 'interlocutor');
    restartListening();
  }, [isRecording, isPaused, isTranscribingFile, isPushToTalkActive, restartListening]);

  const handleClear = () => {
      if (window.confirm(t('clearChatConfirmation', lang))) {
          resetMessages([]);
          setSessionName('');
          setLoadedSession(null);
          setAnalysisResult(null);
      }
  };

  const handleUpdateMessage = useCallback((id: string, newText: string) => {
    setMessages(produce(draft => {
      const msg = draft.find(m => m.id === id);
      if (msg) msg.text = newText;
    }));
  }, [setMessages]);

  const handleChangeSpeaker = useCallback((id: string) => {
    setMessages(produce(draft => {
      const msg = draft.find(m => m.id === id);
      if (msg) {
        if (msg.sender === 'user') msg.sender = 'interlocutor';
        else if (msg.sender === 'interlocutor') msg.sender = 'user';
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
        
        const currentTime = originalMessage.timestamp;
        
        const newSelectedMessage: Message = {
            id: `msg-${Date.now()}`,
            text: selectedText,
            sender: newSpeaker,
            timestamp: currentTime + 0.001,
        };

        if (!textBefore && !textAfter) {
            originalMessage.sender = newSpeaker;
        } else if (!textBefore) {
            originalMessage.text = textAfter;
            draft.splice(originalMessageIndex, 0, newSelectedMessage);
        } else if (!textAfter) {
            originalMessage.text = textBefore;
            draft.splice(originalMessageIndex + 1, 0, newSelectedMessage);
        } else {
            originalMessage.text = textBefore;
            const newAfterMessage: Message = {
                id: `msg-${Date.now() + 1}`,
                text: textAfter,
                sender: originalMessage.sender,
                timestamp: currentTime + 0.002,
            };
            draft.splice(originalMessageIndex + 1, 0, newSelectedMessage, newAfterMessage);
        }
    }));
    setSelectionContext(null);
    window.getSelection()?.removeAllRanges();
}, [setMessages]);


  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages(produce(draft => {
      const indexToDelete = draft.findIndex(m => m.id === messageId);
      if (indexToDelete <= 0) { 
          if(indexToDelete === 0) draft.splice(indexToDelete, 1);
          return;
      }
      const messageToDelete = draft[indexToDelete];
      const previousMessage = draft[indexToDelete - 1];
      previousMessage.text = (previousMessage.text + ' ' + messageToDelete.text).trim();
      draft.splice(indexToDelete, 1);
    }));
  }, [setMessages]);

  const formatChatForExport = (excludeAssistant = false) => {
    return messages
      .filter(msg => {
        if (excludeAssistant && msg.sender === 'assistant') return false;
        return msg.text.trim() !== '';
      })
      .map(msg => {
        let speakerLabel;
        if (msg.sender === 'user') speakerLabel = settings.user.initial;
        else if (msg.sender === 'interlocutor') speakerLabel = settings.interlocutor.initial;
        else speakerLabel = settings.assistant.initial;

        const speakerName = msg.sender === 'user' ? t('you', lang) :
                           msg.sender === 'interlocutor' ? t('speaker', lang) :
                           t('assistant', lang);
                           
        const speaker = `${speakerName} (${speakerLabel})`;
        const time = msg.timestamp ? new Date(msg.timestamp * 1000).toISOString().substr(14, 5) : 'AI';
        return `[${time}] ${speaker}: ${msg.text}`;
      })
      .join('\n');
  };

  const sanitizeFileName = (name: string) => {
    return name.replace(/[^a-z0-9_-s]/gi, '_').replace(/\s+/g, '_').trim() || `chat-${new Date().toISOString()}`;
  };

  const handleSaveAsTxt = () => {
    const text = formatChatForExport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFileName(sessionName)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };
  
  const handleSaveAsPdf = async () => {
    if (!chatWindowRef.current) return;
    setIsExporting(true);
    try {
      const originalHeight = chatWindowRef.current.style.height;
      const originalOverflow = chatWindowRef.current.style.overflowY;
      chatWindowRef.current.style.height = `${chatWindowRef.current.scrollHeight}px`;
      chatWindowRef.current.style.overflowY = 'visible';
      const canvas = await html2canvas(chatWindowRef.current, { scale: 2, useCORS: true, backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-main').trim() });
      chatWindowRef.current.style.height = originalHeight;
      chatWindowRef.current.style.overflowY = originalOverflow;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = pdfWidth / canvas.width;
      const canvasHeightInPdf = canvas.height * ratio;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInPdf);
      let heightLeft = canvasHeightInPdf - pdfHeight;
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInPdf);
        heightLeft -= pdfHeight;
      }
      pdf.save(`${sanitizeFileName(sessionName)}.pdf`);
    } catch (error) {
      console.error("Failed to export as PDF:", error);
      alert("Failed to export as PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const handleSaveAsPng = async () => {
    if (!chatWindowRef.current) return;
    setIsExporting(true);
    try {
       const originalHeight = chatWindowRef.current.style.height;
       const originalOverflow = chatWindowRef.current.style.overflowY;
       chatWindowRef.current.style.height = `${chatWindowRef.current.scrollHeight}px`;
       chatWindowRef.current.style.overflowY = 'visible';
       const canvas = await html2canvas(chatWindowRef.current, { scale: 2, useCORS: true, backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-main').trim() });
       chatWindowRef.current.style.height = originalHeight;
       chatWindowRef.current.style.overflowY = originalOverflow;
       const image = canvas.toDataURL('image/png');
       const a = document.createElement('a');
       a.href = image;
       a.download = `${sanitizeFileName(sessionName)}.png`;
       a.click();
    } catch (error) {
       console.error("Failed to export as PNG:", error);
       alert("Failed to export as PNG. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const handleSaveAsDocx = async () => {
      const doc = new Document({
        sections: [{
            children: messages.map(msg => {
                if (msg.text.trim() === '') return null;
                const speakerLabel = msg.sender === 'user' ? `${t('you', lang)} (${settings.user.initial})` : 
                                     msg.sender === 'interlocutor' ? `${t('speaker', lang)} (${settings.interlocutor.initial})` :
                                     `${t('assistant', lang)} (${settings.assistant.initial})`;
                return new Paragraph({
                    children: [ new TextRun({ text: `${speakerLabel}: `, bold: true }), new TextRun(msg.text) ],
                });
            }).filter(Boolean) as Paragraph[],
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFileName(sessionName)}.docx`;
      a.click();
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
        await navigator.share({ title: 'VoiceInk Chat Log', text: text });
        setShowExportModal(false);
      } catch (error) { console.error('Error sharing:', error); }
    } else {
      alert(t('shareFail', lang));
    }
  };

  const handleLoadSession = async (session: Session) => {
    const audioBlob = await getSessionAudio(session.id);
    const loaded: LoadedSession = { ...session, audioBlob };
    setLoadedSession(loaded);
    resetMessages(loaded.messages);
    setSettings(loaded.settings);
    setSessionName(loaded.name);
    setShowHistoryModal(false);
    stopTranscriptionSession();
  };

  const handleSeekAudio = (time: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = time;
    }
  };

  const handleApiKeySave = (key: string) => {
    setGeminiApiKey(key);
    sessionStorage.setItem('geminiApiKey', key);
    setShowApiKeyModal(false);
  };

  const createEmptyAnalysisResult = (): AnalysisResult => ({
    summary: '',
    actionItems: [],
    keyTopics: [],
  });

  const handleGenerateSummary = async () => {
    if (!geminiApiKey) { setShowApiKeyModal(true); return; }
    if (!loadedSession) return;
    const conversationText = formatChatForExport(true);
    if (!conversationText) return;
    
    setIsAIProcessing(prev => ({ ...prev, summary: true }));
    try {
        const summary = await getSummary(geminiApiKey, conversationText, lang);
        const newResult = produce(analysisResult || createEmptyAnalysisResult(), draft => {
            draft.summary = summary;
        });
        setAnalysisResult(newResult);
        await updateSessionAnalysis(loadedSession.id, newResult);
    } catch (error) {
        console.error("Summary generation failed:", error);
        alert(t('aiError', lang));
    } finally {
        setIsAIProcessing(prev => ({ ...prev, summary: false }));
    }
  };

  const handleExtractActionItems = async () => {
    if (!geminiApiKey) { setShowApiKeyModal(true); return; }
    if (!loadedSession) return;
    const conversationText = formatChatForExport(true);
    if (!conversationText) return;
    
    setIsAIProcessing(prev => ({ ...prev, actionItems: true }));
    try {
        const items = await getActionItems(geminiApiKey, conversationText, lang);
        const newResult = produce(analysisResult || createEmptyAnalysisResult(), draft => {
            draft.actionItems = items;
        });
        setAnalysisResult(newResult);
        await updateSessionAnalysis(loadedSession.id, newResult);
    } catch (error) {
        console.error("Action item extraction failed:", error);
        alert(t('aiError', lang));
    } finally {
        setIsAIProcessing(prev => ({ ...prev, actionItems: false }));
    }
  };

  const handleExtractTopics = async () => {
    if (!geminiApiKey) { setShowApiKeyModal(true); return; }
    if (!loadedSession) return;
    const conversationText = formatChatForExport(true);
    if (!conversationText) return;
    
    setIsAIProcessing(prev => ({ ...prev, topics: true }));
    try {
        const topics = await getKeyTopics(geminiApiKey, conversationText, lang);
        const newResult = produce(analysisResult || createEmptyAnalysisResult(), draft => {
            draft.keyTopics = topics;
        });
        setAnalysisResult(newResult);
        await updateSessionAnalysis(loadedSession.id, newResult);
    } catch (error) {
        console.error("Key topics extraction failed:", error);
        alert(t('aiError', lang));
    } finally {
        setIsAIProcessing(prev => ({ ...prev, topics: false }));
    }
  };

  useEffect(() => {
    const body = document.body;
    body.className = '';
    body.classList.add(`theme-${settings.theme}`);
  }, [settings.theme]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-grow flex flex-col">
          <Header 
            onExport={() => setShowExportModal(true)} 
            onClear={handleClear} 
            onSettings={() => setShowSettingsModal(true)}
            onHistoryClick={() => setShowHistoryModal(true)}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onHelpClick={startTour}
            lang={lang}
          />
          {(isRecording || sessionName) && (
            <SessionBar sessionName={sessionName} />
          )}
          <ChatWindow 
            ref={chatWindowRef}
            messages={messages} 
            interimTranscript={interimTranscript} 
            currentSpeaker={isPushToTalkActive ? 'user' : 'interlocutor'} 
            isRecording={isRecording}
            isPaused={isPaused}
            isTranscribingFile={isTranscribingFile}
            settings={settings}
            onUpdateMessage={handleUpdateMessage}
            onChangeSpeaker={handleChangeSpeaker}
            onDeleteMessage={handleDeleteMessage}
            lang={lang}
            playbackTime={playbackTime}
            onSeekAudio={handleSeekAudio}
          />
          
          {selectionContext && (
            <ContextualActionBar 
                onSplit={handleSplitMessage}
                onClear={() => setSelectionContext(null)}
                context={selectionContext}
                settings={settings}
                lang={lang}
            />
          )}
          
          {loadedSession?.audioBlob && (
            <AudioPlayer 
                ref={audioPlayerRef}
                blob={loadedSession.audioBlob} 
                onTimeUpdate={setPlaybackTime} 
            />
          )}

          <TranscriptionControls 
            isRecording={isRecording}
            isPaused={isPaused}
            isPushToTalkActive={isPushToTalkActive}
            isTranscribingFile={isTranscribingFile}
            onStartClick={handleStartClick}
            onStopClick={handleStopClick}
            onPauseClick={handlePauseClick}
            onMicToggle={handleMicToggle}
            onAIToggle={() => setShowInsightsPanel(prev => !prev)}
            isAIAssistantOpen={showInsightsPanel}
            lang={lang}
          />
        </div>
        <InsightsPanel
            isOpen={showInsightsPanel}
            onClose={() => setShowInsightsPanel(false)}
            onGenerateSummary={handleGenerateSummary}
            onExtractActionItems={handleExtractActionItems}
            onExtractTopics={handleExtractTopics}
            analysisResult={analysisResult}
            isProcessing={isAIProcessing}
            isSessionLoaded={!!loadedSession}
            lang={lang}
        />
      </div>

      {showExportModal && <ExportModal 
        onClose={() => setShowExportModal(false)}
        onSaveAsTxt={handleSaveAsTxt}
        onSaveAsPdf={handleSaveAsPdf}
        onSaveAsPng={handleSaveAsPng}
        onSaveAsDocx={handleSaveAsDocx}
        onCopyToClipboard={handleCopyToClipboard}
        onSendToApp={handleSendToApp}
        isExporting={isExporting}
        lang={lang}
      />}
      {showSettingsModal && <SettingsModal 
        settings={settings}
        onClose={() => setShowSettingsModal(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setShowSettingsModal(false);
        }}
        lang={lang}
      />}
      {showSessionNameModal && <SessionNameModal 
        onClose={() => setShowSessionNameModal(false)}
        onConfirm={handleSessionNameConfirmed}
        lang={lang}
      />}
      {showSourceModal && <SourceSelectionModal 
        onClose={() => {
            setShowSourceModal(false);
            stopMediaStream();
        }}
        onSelectSource={handleSourceSelected}
        onFileSelectClick={handleFileSelectClick}
        lang={lang}
      />}
      {showFileInstructionsModal && audioFile && <FileInstructionsModal
        fileName={audioFile.name}
        onClose={handleCancelFileTranscriptionFlow}
        onConfirm={handleStartFileTranscriptionFlow}
        lang={lang}
      />}
      {showHistoryModal && <HistoryModal
        sessions={sessions}
        onClose={() => setShowHistoryModal(false)}
        onLoad={handleLoadSession}
        onDelete={deleteSession}
        lang={lang}
      />}
      {showApiKeyModal && <ApiKeyModal 
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
        lang={lang}
      />}

      {/* Hidden elements for functionality */}
      <audio ref={streamAudioRef} playsInline muted />
      <audio ref={fileAudioRef} onEnded={stopTranscriptionSession} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="audio/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default App;
