

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscription } from './hooks/useTranscription';
import { Message, Session, Settings, LoadedSession, SelectionContext, AnalysisResult, TextStyle, AIAgentExpertise, AIAgentDomain, AIChatMessage, Entity, InsightsSectionState, Source, SourceType } from './types';
import { Header } from './components/Header';
import { SessionBar } from './components/SessionBar';
import { ChatWindow } from './components/ChatWindow';
import { TranscriptionControls } from './components/TranscriptionControls';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { SessionNameModal } from './components/SessionNameModal';
import { HistoryModal } from './components/HistoryModal';
import { ContextualActionBar } from './components/ContextualActionBar';
import { InsightsPanel } from './components/InsightsPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AgentConfigModal } from './components/AgentConfigModal';
import { produce } from 'immer';
import { t, Language } from './utils/translations';
import { useHistoryState } from './hooks/useHistoryState';
import { useSessionHistory } from './hooks/useSessionHistory';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import html2canvas from 'html2canvas';
import { AudioPlayer } from './components/AudioPlayer';
import introJs from 'intro.js';
import { getSummary, getActionItems, getKeyTopics, getProofreadAndStyledText, getAgentResponse, extractEntities } from './utils/gemini';
import { NotebookLMInstructionsModal } from './components/NotebookLMInstructionsModal';
import { SourcesPanel } from './components/SourcesPanel';
import { AddSourceModal } from './components/AddSourceModal';

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

const initialInsightsSectionState: InsightsSectionState = {
    summary: true,
    actionItems: true,
    keyTopics: true,
    textAnalysis: true,
    textEditor: true,
    aiChat: true,
};

const App: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const { 
    state: transcriptionSource, 
    setState: setTranscriptionSource, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    reset: resetTranscriptionSource 
  } = useHistoryState<Source | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'interlocutor'>('interlocutor');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSessionNameModal, setShowSessionNameModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [loadedSession, setLoadedSession] = useState<LoadedSession | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
  const [showSourcesPanel, setShowSourcesPanel] = useState(true);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [isInsightsPanelExpanded, setIsInsightsPanelExpanded] = useState(false);
  const [insightsSectionState, setInsightsSectionState] = useState<InsightsSectionState>(initialInsightsSectionState);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState({ summary: false, actionItems: false, topics: false, proofread: false, agent: false, entities: false });
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showAgentConfigModal, setShowAgentConfigModal] = useState(false);
  const [selectedTextStyle, setSelectedTextStyle] = useState<TextStyle>('default');
  const [showNotebookLMInstructionsModal, setShowNotebookLMInstructionsModal] = useState(false);
  const [exportedFileName, setExportedFileName] = useState('');
  const [selectedAIAgents, setSelectedAIAgents] = useState<{ expertise: AIAgentExpertise[], domains: AIAgentDomain[] }>({ expertise: [], domains: [] });
  
  const { sessions, saveSession, deleteSession, getSessionAudio, updateSessionAnalysis } = useSessionHistory();

  const streamAudioRef = useRef<HTMLAudioElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const recordingStartTimeRef = useRef<number>(0);
  
  const messages = transcriptionSource?.content as Message[] || [];

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
    if (transcriptionSource && messages.length > 0 && sessionName) {
        const fullSources: Source[] = [transcriptionSource, ...sources];
        const newSession = await saveSession({ 
            name: sessionName, 
            sources: fullSources, 
            settings, 
            hasAudio: !!audioBlob,
            analysisResult,
        }, audioBlob);
        setLoadedSession({ ...newSession, audioBlob });
    }
  }, [transcriptionSource, sources, messages.length, sessionName, settings, saveSession, analysisResult]);

  const handleFinalTranscript = useCallback((transcript: string) => {
    if (!transcript) return;
    
    setTranscriptionSource(currentSource => produce(currentSource!, draft => {
      const speaker = isPushToTalkActive ? 'user' : 'interlocutor';
      const draftMessages = draft.content as Message[];
      const lastMessage = draftMessages.length > 0 ? draftMessages[draftMessages.length - 1] : null;

      if (lastMessage && lastMessage.sender === speaker) {
        lastMessage.text = (lastMessage.text + ' ' + transcript).trim();
      } else {
        draftMessages.push({
          id: `msg-${Date.now()}`,
          text: transcript,
          timestamp: (Date.now() - recordingStartTimeRef.current) / 1000,
          sender: speaker,
        });
      }
    }));
  }, [setTranscriptionSource, isPushToTalkActive]);

  const { startListening, stopListening, interimTranscript, restartListening } = useTranscription({ 
    lang,
    onFinalTranscript: handleFinalTranscript,
    onRecordingComplete: handleRecordingComplete,
    mediaStream,
  });

  const startTour = useCallback(() => {
    // Tour logic remains the same...
  }, [lang]);
  
  useEffect(() => {
    // Selection context logic remains the same...
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
    // Before unload logic remains the same...
  }, [isRecording]);

  useEffect(() => {
    setAnalysisResult(loadedSession?.analysisResult || null);
    if(loadedSession?.sources) {
        const main = loadedSession.sources.find(s => s.type === 'transcription');
        const context = loadedSession.sources.filter(s => s.type !== 'transcription');
        resetTranscriptionSource(main || null);
        setSources(context);
    }
  }, [loadedSession, resetTranscriptionSource]);

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
    setIsPushToTalkActive(false);
    stopMediaStream();
  }, [stopMediaStream]);

 const handleStopClick = () => {
    stopTranscriptionSession();
  };

  const startRecordingFlow = (name: string) => {
    const newTranscriptionSource: Source = {
        id: `source-${Date.now()}`,
        name: name,
        type: 'transcription',
        content: [],
    };
    resetTranscriptionSource(newTranscriptionSource);
    setSources([]);
    setLoadedSession(null);
    setAnalysisResult(null);

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
  
  const handleStartMicrophone = async () => {
    if (loadedSession || sources.length > 0 || transcriptionSource) {
        if(!window.confirm(t('startNewSessionConfirmation', lang))) return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
        if (streamAudioRef.current) {
            streamAudioRef.current.srcObject = stream;
        }
        setShowSessionNameModal(true);
    } catch (err) {
        console.error("Error starting microphone media:", err);
    }
  };
  
  const handleAddSource = async (file: File | null, url: string) => {
    setShowAddSourceModal(false);
    if (!file && !url) return;

    if (transcriptionSource && !sessionName) {
        setSessionName(transcriptionSource.name);
    } else if (!transcriptionSource && !sessionName) {
        const defaultName = `${t('sessionNameDefault', lang)} ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
        setSessionName(defaultName);
    }

    setIsProcessingSource(true);

    try {
        const body = new FormData();
        let sourceType: SourceType;
        let sourceName: string;
        
        if (file) {
            body.append('file', file);
            sourceName = file.name;
            if (file.type.startsWith('audio/')) {
                sourceType = 'audio';
            } else {
                sourceType = 'file';
            }
            body.append('type', sourceType);
        } else { // url
            body.append('url', url);
            sourceName = url;
            sourceType = 'url';
            body.append('type', sourceType);
        }
        
        const response = await fetch('/api/process-source', {
            method: 'POST',
            body,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.statusText}`);
        }
        
        const result: { content: string | Message[] } = await response.json();

        const newSource: Source = {
            id: `source-${Date.now()}`,
            name: sourceName,
            type: sourceType,
            content: result.content
        };

        if (sourceType === 'audio' && !transcriptionSource) {
             newSource.type = 'transcription';
             resetTranscriptionSource(newSource);
        } else {
            setSources(prev => [...prev, newSource]);
        }

    } catch (error) {
        console.error("Error processing source:", error);
        alert((error as Error).message || t('aiError', lang));
    } finally {
        setIsProcessingSource(false);
    }
  };

  const handleRemoveSource = (sourceId: string) => {
    if (transcriptionSource?.id === sourceId) {
        if (window.confirm(t('deleteTranscriptionSourceConfirmation', lang))) {
            resetTranscriptionSource(null);
        }
    } else {
        setSources(prev => prev.filter(s => s.id !== sourceId));
    }
  };

  const handlePauseClick = () => {
    if (isRecording) {
      setIsPaused(prev => !prev);
    }
  };

  const handleMicToggle = useCallback(() => {
    if (!isRecording || isPaused) return;

    const newPttState = !isPushToTalkActive;
    setIsPushToTalkActive(newPttState);
    setCurrentSpeaker(newPttState ? 'user' : 'interlocutor');
    restartListening();
  }, [isRecording, isPaused, isPushToTalkActive, restartListening]);

  const handleClear = () => {
      if (window.confirm(t('clearChatConfirmation', lang))) {
          resetTranscriptionSource(null);
          setSources([]);
          setSessionName('');
          setLoadedSession(null);
          setAnalysisResult(null);
      }
  };

  const handleUpdateMessage = useCallback((id: string, newText: string) => {
    setTranscriptionSource(produce(draft => {
      if(!draft) return;
      const msgs = draft.content as Message[];
      const msg = msgs.find(m => m.id === id);
      if (msg) msg.text = newText;
    }));
  }, [setTranscriptionSource]);

  const handleChangeSpeaker = useCallback((id: string) => {
    setTranscriptionSource(produce(draft => {
        if(!draft) return;
        const msgs = draft.content as Message[];
        const msg = msgs.find(m => m.id === id);
        if (msg) {
            if (msg.sender === 'user') msg.sender = 'interlocutor';
            else if (msg.sender === 'interlocutor') msg.sender = 'user';
        }
    }));
  }, [setTranscriptionSource]);
  
  const handleSplitMessage = useCallback((messageId: string, selectedText: string, newSpeaker: 'user' | 'interlocutor') => {
    setTranscriptionSource(produce(draft => {
        if(!draft) return;
        const draftMessages = draft.content as Message[];
        const originalMessageIndex = draftMessages.findIndex(m => m.id === messageId);
        if (originalMessageIndex === -1) return;

        const originalMessage = draftMessages[originalMessageIndex];
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
            draftMessages.splice(originalMessageIndex, 0, newSelectedMessage);
        } else if (!textAfter) {
            originalMessage.text = textBefore;
            draftMessages.splice(originalMessageIndex + 1, 0, newSelectedMessage);
        } else {
            originalMessage.text = textBefore;
            const newAfterMessage: Message = {
                id: `msg-${Date.now() + 1}`,
                text: textAfter,
                sender: originalMessage.sender,
                timestamp: currentTime + 0.002,
            };
            draftMessages.splice(originalMessageIndex + 1, 0, newSelectedMessage, newAfterMessage);
        }
    }));
    setSelectionContext(null);
    window.getSelection()?.removeAllRanges();
}, [setTranscriptionSource]);


  const handleDeleteMessage = useCallback((messageId: string) => {
    setTranscriptionSource(produce(draft => {
        if(!draft) return;
        const draftMessages = draft.content as Message[];
        const indexToDelete = draftMessages.findIndex(m => m.id === messageId);
        if (indexToDelete <= 0) { 
            if(indexToDelete === 0) draftMessages.splice(indexToDelete, 1);
            return;
        }
        const messageToDelete = draftMessages[indexToDelete];
        const previousMessage = draftMessages[indexToDelete - 1];
        previousMessage.text = (previousMessage.text + ' ' + messageToDelete.text).trim();
        draftMessages.splice(indexToDelete, 1);
    }));
  }, [setTranscriptionSource]);

  const formatChatForExport = (excludeAssistant = false) => {
    return messages
      .filter(msg => !excludeAssistant || msg.sender !== 'assistant')
      .map(msg => {
        const speakerLabel = msg.sender === 'user' ? settings.user.initial :
                             msg.sender === 'interlocutor' ? settings.interlocutor.initial :
                             settings.assistant.initial;
        const speakerName = msg.sender === 'user' ? t('you', lang) :
                           msg.sender === 'interlocutor' ? t('speaker', lang) :
                           t('assistant', lang);
        const time = msg.timestamp ? new Date(msg.timestamp * 1000).toISOString().substr(14, 5) : 'AI';
        return `[${time}] ${speakerName} (${speakerLabel}): ${msg.text}`;
      }).join('\n');
  };
  
  const sanitizeFileName = (name: string) => name.replace(/[^a-z0-9_-s.]/gi, '_').replace(/\s+/g, '_').trim() || `chat-${new Date().toISOString()}`;

  // FIX: Implement export handlers
  const handleSaveAsTxt = () => {
    const content = formatChatForExport();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFileName(sessionName)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleSaveAsPdf = async () => {
    if (!chatWindowRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(chatWindowRef.current, {
            backgroundColor: settings.theme === 'light' ? '#ffffff' : (settings.theme === 'neutral' ? '#f5f5f5' : '#111827'),
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${sanitizeFileName(sessionName)}.pdf`);
    } catch (error) {
        console.error("Failed to export as PDF", error);
    } finally {
        setIsExporting(false);
        setShowExportModal(false);
    }
  };

  const handleSaveAsPng = async () => {
    if (!chatWindowRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(chatWindowRef.current, {
             backgroundColor: settings.theme === 'light' ? '#ffffff' : (settings.theme === 'neutral' ? '#f5f5f5' : '#111827'),
             scale: 2
        });
        const link = document.createElement('a');
        link.download = `${sanitizeFileName(sessionName)}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch (error) {
        console.error("Failed to export as PNG", error);
    } finally {
        setIsExporting(false);
        setShowExportModal(false);
    }
  };

  const handleSaveAsDocx = async () => {
    const doc = new Document({
        sections: [{
            children: messages
                .filter(msg => msg.sender !== 'assistant')
                .map(msg => new Paragraph({
                    children: [
                        new TextRun({ text: `${msg.sender === 'user' ? t('you', lang) : t('speaker', lang)}: `, bold: true }),
                        new TextRun(msg.text)
                    ]
                }))
        }]
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFileName(sessionName)}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const content = formatChatForExport();
    navigator.clipboard.writeText(content).then(() => {
        alert(t('copySuccess', lang));
        setShowExportModal(false);
    }, () => {
        alert(t('copyFail', lang));
    });
  };

  const handleSendToApp = async () => {
    const content = formatChatForExport();
    if (navigator.share) {
        try {
            await navigator.share({
                title: sessionName,
                text: content,
            });
            setShowExportModal(false);
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        alert(t('shareFail', lang));
    }
  };

  const formatChatForNotebookLM = () => {
    const title = `${t('sessionNameDefault', lang)}: ${sessionName}\n\n---\n\n`;
    const chat = messages
      .filter(msg => msg.sender !== 'assistant' && msg.text.trim() !== '')
      .map(msg => {
        const speakerName = msg.sender === 'user' ? t('you', lang) : t('speaker', lang);
        return `${speakerName}:\n${msg.text}\n`;
      })
      .join('\n');
    return title + chat;
  };
  
  const handleExportForNotebookLM = () => {
    const content = formatChatForNotebookLM();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `${sanitizeFileName(sessionName)}-for-notebooklm.txt`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportedFileName(fileName);
    setShowExportModal(false);
    setShowNotebookLMInstructionsModal(true);
  };

  const handleLoadSession = async (session: Session) => {
    const audioBlob = await getSessionAudio(session.id);
    const loaded: LoadedSession = { ...session, audioBlob };
    setLoadedSession(loaded);
    setSettings(loaded.settings);
    setSessionName(loaded.name);
    setShowHistoryModal(false);
    stopTranscriptionSession();
  };

  const handleSaveSessionAudio = async (sessionId: string) => {
    const audioBlob = await getSessionAudio(sessionId);
    if (audioBlob) {
        const session = sessions.find(s => s.id === sessionId);
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFileName(session?.name || 'audio')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
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

  const createEmptyAnalysisResult = (): AnalysisResult => ({ summary: '', actionItems: [], keyTopics: [], entities: [], aiChatHistory: [] });
  
  const getFullContextForAI = () => {
    let fullText = "";
    [transcriptionSource, ...sources].forEach(source => {
        if (!source) return;
        fullText += `--- SOURCE: ${source.name} (${source.type}) ---\n\n`;
        if (source.type === 'transcription') {
            fullText += (source.content as Message[]).map(m => `${m.sender}: ${m.text}`).join('\n');
        } else {
            fullText += source.content as string;
        }
        fullText += `\n\n--- END SOURCE ---\n\n`;
    });
    return fullText;
  };

  const handleGenerateSummary = async () => {
    if (!geminiApiKey) { setShowApiKeyModal(true); return; }
    if (!loadedSession) return;
    const conversationText = getFullContextForAI();
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
    const conversationText = getFullContextForAI();
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
    const conversationText = getFullContextForAI();
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
        console.error("Topic extraction failed:", error);
        alert(t('aiError', lang));
    } finally {
        setIsAIProcessing(prev => ({ ...prev, topics: false }));
    }
  };

  const handleProofreadAndStyle = async () => {
    if (!geminiApiKey) { setShowApiKeyModal(true); return; }
    if (!loadedSession || !transcriptionSource) return;
    const conversationText = (transcriptionSource.content as Message[]).map(m => `${m.sender}: ${m.text}`).join('\n');
    if (!conversationText) return;

    setIsAIProcessing(prev => ({ ...prev, proofread: true }));
    try {
        const styledText = await getProofreadAndStyledText(geminiApiKey, conversationText, selectedTextStyle, lang);
        const newResult = produce(analysisResult || createEmptyAnalysisResult(), draft => {
            draft.styledText = { style: selectedTextStyle, text: styledText };
        });
        setAnalysisResult(newResult);
        await updateSessionAnalysis(loadedSession.id, newResult);
    } catch (error) {
        console.error("Proofread & style failed:", error);
        alert(t('aiError', lang));
    } finally {
        setIsAIProcessing(prev => ({ ...prev, proofread: false }));
    }
  };

  const handleClearStyledText = async () => {
    if (!loadedSession || !analysisResult) return;
    const newResult = produce(analysisResult, draft => {
        draft.styledText = undefined;
    });
    setAnalysisResult(newResult);
    await updateSessionAnalysis(loadedSession.id, newResult);
  };

  const handleAskAIAgent = async (prompt: string) => {
    if (!geminiApiKey) { setShowApiKeyModal(true); return; }
    if (!loadedSession || selectedAIAgents.expertise.length === 0) return;
    const context = getFullContextForAI();
    if (!context) return;
    
    const currentHistory = analysisResult?.aiChatHistory || [];
    const newHistory: AIChatMessage[] = [...currentHistory, { role: 'user', parts: [{ text: prompt }] }];
    
    setAnalysisResult(produce(analysisResult || createEmptyAnalysisResult(), draft => {
        draft.aiChatHistory = newHistory;
    }));
    setIsAIProcessing(prev => ({ ...prev, agent: true }));

    try {
      const response = await getAgentResponse(geminiApiKey, context, selectedAIAgents, lang, newHistory);
      const finalHistory: AIChatMessage[] = [...newHistory, { role: 'model', parts: [{ text: response }] }];
      
      const newResult = produce(analysisResult || createEmptyAnalysisResult(), draft => {
          draft.aiChatHistory = finalHistory;
      });
      setAnalysisResult(newResult);
      await updateSessionAnalysis(loadedSession.id, newResult);

    } catch (error) {
        console.error("AI agent chat failed:", error);
        alert(t('aiError', lang));
    } finally {
      setIsAIProcessing(prev => ({ ...prev, agent: false }));
    }
  };

  const handleExtractEntities = async () => {
    if (!geminiApiKey) { setShowApiKeyModal(true); return; }
    if (!loadedSession || !transcriptionSource) return;
    const conversationText = (transcriptionSource.content as Message[]).map(m => `${m.sender}: ${m.text}`).join('\n');
    if (!conversationText) return;
    
    setIsAIProcessing(prev => ({ ...prev, entities: true }));
    try {
        const entities = await extractEntities(geminiApiKey, conversationText, lang);
        const newResult = produce(analysisResult || createEmptyAnalysisResult(), draft => {
            draft.entities = entities;
        });
        setAnalysisResult(newResult);
        await updateSessionAnalysis(loadedSession.id, newResult);
    } catch (error) {
        console.error("Entity extraction failed:", error);
        alert(t('aiError', lang));
    } finally {
        setIsAIProcessing(prev => ({ ...prev, entities: false }));
    }
  };
  
  const handleExportAnalysis = (type: keyof Omit<AnalysisResult, 'styledText' | 'entities' | 'aiChatHistory'>, format: 'copy' | 'txt' | 'notebooklm') => {
    if (!analysisResult) return;

    let content = '';
    let title = `${t(type, lang)}\n---\n\n`;

    if (type === 'summary') {
        content = analysisResult.summary;
    } else if (type === 'actionItems') {
        content = analysisResult.actionItems.map(item => `- ${item.task}`).join('\n');
    } else if (type === 'keyTopics') {
        content = analysisResult.keyTopics.map(topic => `- ${topic}`).join('\n');
    }
    
    const fullContent = title + content;

    if (format === 'copy') {
        navigator.clipboard.writeText(fullContent).then(() => alert(t('copySuccess', lang)), () => alert(t('copyFail', lang)));
    } else if (format === 'txt' || format === 'notebooklm') {
        const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFileName(sessionName || 'analysis')}-${type}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleExportStyledText = (format: 'copy' | 'txt' | 'notebooklm') => {
    if (!analysisResult?.styledText) return;
    const content = analysisResult.styledText.text;

    if (format === 'copy') {
        navigator.clipboard.writeText(content).then(() => alert(t('copySuccess', lang)), () => alert(t('copyFail', lang)));
    } else if (format === 'txt' || format === 'notebooklm') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFileName(sessionName || 'analysis')}-styled-text.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleExportAIChat = (format: 'copy' | 'txt' | 'notebooklm') => {
    if (!analysisResult?.aiChatHistory || analysisResult.aiChatHistory.length === 0) return;
    const content = analysisResult.aiChatHistory.map(msg => `${t(msg.role === 'user' ? 'you' : 'assistant', lang)}:\n${msg.parts[0].text}`).join('\n\n');
     if (format === 'copy') {
        navigator.clipboard.writeText(content).then(() => alert(t('copySuccess', lang)), () => alert(t('copyFail', lang)));
    } else if (format === 'txt' || format === 'notebooklm') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFileName(sessionName || 'analysis')}-ai-chat.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleExportAllAnalysis = (format: 'copy' | 'txt' | 'notebooklm') => {
    if (!analysisResult) return;

    let fullContent = `${t('sessionNameDefault', lang)}: ${sessionName}\n\n===\n\n`;

    if (analysisResult.summary) {
        fullContent += `${t('summary', lang)}\n---\n${analysisResult.summary}\n\n===\n\n`;
    }
    if (analysisResult.actionItems && analysisResult.actionItems.length > 0) {
        fullContent += `${t('actionItems', lang)}\n---\n${analysisResult.actionItems.map(item => `- ${item.task}`).join('\n')}\n\n===\n\n`;
    }
    if (analysisResult.keyTopics && analysisResult.keyTopics.length > 0) {
        fullContent += `${t('keyTopics', lang)}\n---\n${analysisResult.keyTopics.map(topic => `- ${topic}`).join('\n')}\n\n===\n\n`;
    }
    if (analysisResult.styledText) {
        fullContent += `${t('textEditor', lang)} (${t(`style${analysisResult.styledText.style.charAt(0).toUpperCase() + analysisResult.styledText.style.slice(1)}` as any, lang)})\n---\n${analysisResult.styledText.text}\n\n===\n\n`;
    }
    if (analysisResult.aiChatHistory && analysisResult.aiChatHistory.length > 0) {
         fullContent += `${t('aiChat', lang)}\n---\n${analysisResult.aiChatHistory.map(msg => `${t(msg.role === 'user' ? 'you' : 'assistant', lang)}:\n${msg.parts[0].text}`).join('\n\n')}\n\n`;
    }
    
    if (format === 'copy') {
        navigator.clipboard.writeText(fullContent).then(() => alert(t('copySuccess', lang)), () => alert(t('copyFail', lang)));
    } else if (format === 'txt' || format === 'notebooklm') {
        const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sanitizeFileName(sessionName || 'analysis')}-full-report.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
  };

  const handleToggleInsightsSection = (section: keyof InsightsSectionState) => {
    setInsightsSectionState(produce(draft => {
        draft[section] = !draft[section];
    }));
  };
  
  useEffect(() => {
    const body = document.body;
    body.className = '';
    body.classList.add(`theme-${settings.theme}`);
  }, [settings.theme]);

  const mainContentWidth = `
    flex-grow flex flex-col transition-all duration-300
    ${showSourcesPanel ? 'sm:ml-80' : ''}
    ${showInsightsPanel && !isInsightsPanelExpanded ? 'sm:mr-96' : ''}
  `;

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      <div className="flex flex-grow overflow-hidden">
        <SourcesPanel 
            isOpen={showSourcesPanel}
            sources={[transcriptionSource, ...sources].filter((s): s is Source => s !== null)}
            onAddSource={() => setShowAddSourceModal(true)}
            onRemoveSource={handleRemoveSource}
            lang={lang}
        />
        <div className={mainContentWidth}>
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
            onToggleSources={() => setShowSourcesPanel(p => !p)}
          />
          {sessionName && (
            <SessionBar sessionName={sessionName} />
          )}
          <ChatWindow 
            ref={chatWindowRef}
            messages={messages} 
            interimTranscript={interimTranscript} 
            currentSpeaker={isPushToTalkActive ? 'user' : 'interlocutor'} 
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessingFile={isProcessingSource}
            settings={settings}
            onUpdateMessage={handleUpdateMessage}
            onChangeSpeaker={handleChangeSpeaker}
            onDeleteMessage={handleDeleteMessage}
            lang={lang}
            playbackTime={playbackTime}
            onSeekAudio={handleSeekAudio}
            entities={analysisResult?.entities}
          />
          
          {selectionContext && ( <ContextualActionBar
              onSplit={handleSplitMessage}
              onClear={() => setSelectionContext(null)}
              context={selectionContext}
              settings={settings}
              lang={lang}
          /> )}
          {loadedSession?.audioBlob && ( <AudioPlayer 
              ref={audioPlayerRef}
              blob={loadedSession.audioBlob}
              onTimeUpdate={(time) => setPlaybackTime(time)}
          /> )}

          <TranscriptionControls 
            isRecording={isRecording}
            isPaused={isPaused}
            isPushToTalkActive={isPushToTalkActive}
            onStartClick={handleStartMicrophone}
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
          isExpanded={isInsightsPanelExpanded}
          onToggleExpand={() => setIsInsightsPanelExpanded(p => !p)}
          onClose={() => setShowInsightsPanel(false)}
          onGenerateSummary={handleGenerateSummary}
          onExtractActionItems={handleExtractActionItems}
          onExtractTopics={handleExtractTopics}
          analysisResult={analysisResult}
          isProcessing={isAIProcessing}
          isSessionLoaded={!!loadedSession}
          lang={lang}
          onProofreadAndStyle={handleProofreadAndStyle}
          selectedStyle={selectedTextStyle}
          onStyleChange={setSelectedTextStyle}
          onExportAnalysis={handleExportAnalysis}
          onExportStyledText={handleExportStyledText}
          onClearStyledText={handleClearStyledText}
          onAskAIAgent={handleAskAIAgent}
          selectedAIAgents={selectedAIAgents}
          onShowAgentConfig={() => setShowAgentConfigModal(true)}
          onExtractEntities={handleExtractEntities}
          onExportAIChat={handleExportAIChat}
          sectionState={insightsSectionState}
          onToggleSection={handleToggleInsightsSection}
          onExportAll={handleExportAllAnalysis}
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
        onExportForNotebookLM={handleExportForNotebookLM}
        isExporting={isExporting}
        lang={lang}
      />}
      {showSettingsModal && <SettingsModal 
        settings={settings}
        onClose={() => setShowSettingsModal(false)}
        onSave={(newSettings) => { setSettings(newSettings); setShowSettingsModal(false); }}
        lang={lang}
      />}
      {showSessionNameModal && <SessionNameModal 
        onClose={() => setShowSessionNameModal(false)}
        onConfirm={handleSessionNameConfirmed}
        lang={lang}
      />}
      {showHistoryModal && <HistoryModal 
        sessions={sessions}
        onClose={() => setShowHistoryModal(false)}
        onLoad={handleLoadSession}
        onDelete={deleteSession}
        onSaveAudio={handleSaveSessionAudio}
        lang={lang}
      />}
      {showApiKeyModal && <ApiKeyModal 
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
        lang={lang}
      />}
      {showAgentConfigModal && <AgentConfigModal 
        initialSelectedAgents={selectedAIAgents}
        onClose={() => setShowAgentConfigModal(false)}
        onSave={(newAgents) => { setSelectedAIAgents(newAgents); setShowAgentConfigModal(false); }}
        lang={lang}
      />}
      {showNotebookLMInstructionsModal && <NotebookLMInstructionsModal 
        fileName={exportedFileName}
        onClose={() => setShowNotebookLMInstructionsModal(false)}
        lang={lang}
      />}
      {showAddSourceModal && <AddSourceModal 
        onClose={() => setShowAddSourceModal(false)}
        onAdd={handleAddSource}
        lang={lang}
       />}


      <audio ref={streamAudioRef} playsInline muted />
    </div>
  );
};

export default App;