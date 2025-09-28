
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscription } from './hooks/useTranscription';
import { Message, Session, Settings, LoadedSession, SelectionContext, AnalysisResult, TextStyle, AIAgentExpertise, AIAgentDomain, AIChatMessage, Entity, InsightsSectionState, Source, SourceType, SessionProfileId, Note, StudioToolId, ToolSettings } from './types';
import { Header } from './components/Header';
import { SessionBar } from './components/SessionBar';
import { ChatWindow } from './components/ChatWindow';
import { TranscriptionControls } from './components/TranscriptionControls';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { NewSessionModal } from './components/NewSessionModal';
import { HistoryModal } from './components/HistoryModal';
import { StudioPanel } from './components/StudioPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AgentConfigModal } from './components/AgentConfigModal';
import { produce } from 'immer';
import { t, Language, translations } from './utils/translations';
import { useHistoryState } from './hooks/useHistoryState';
import { useSessionHistory } from './hooks/useSessionHistory';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import html2canvas from 'html2canvas';
import { AudioPlayer } from './components/AudioPlayer';
import introJs from 'intro.js';
import { getSummary, getActionItems, getKeyTopics, getProofreadAndStyledText, getAgentResponse, extractEntities, getSourceGuide, getEmotionAnalysis, getTonalityAnalysis, getStyledText } from './utils/gemini';
import { NotebookLMInstructionsModal } from './components/NotebookLMInstructionsModal';
import { SourcesPanel } from './components/SourcesPanel';
import { AddSourceModal } from './components/AddSourceModal';
import { MainAIChatInput } from './components/MainAIChatInput';
import { TextEditorToolbar } from './components/TextEditorToolbar';
import { RenameSourceModal } from './components/RenameSourceModal';
import { SearchSourcesModal } from './components/SearchSourcesModal';
import { profiles, studioTools } from './utils/profiles';
import { StudioConfigModal } from './components/StudioConfigModal';

const MAX_FILE_SIZE_MB = 4.5;

const getDefaultSettings = (): Settings => ({
  user: { initial: 'U', bubbleColor: 'bg-blue-600', avatarColor: 'bg-blue-800' },
  interlocutor: { initial: 'S', bubbleColor: 'bg-slate-700', avatarColor: 'bg-slate-600' },
  assistant: { initial: 'AI', bubbleColor: 'bg-gradient-to-br from-purple-600 to-indigo-600', avatarColor: 'bg-purple-800' },
  theme: 'dark',
  language: 'ru',
});

const getInitialSession = (): Session => ({
    id: `session-${Date.now()}`,
    name: 'New Session',
    profileId: 'pedagogical', // Default profile
    activeTools: profiles['pedagogical'].tools,
    sources: [],
    notes: [],
    settings: getDefaultSettings(),
    savedAt: new Date().toISOString(),
    hasAudio: false,
    analysisResult: null,
    selectedSourceIds: [],
    toolSettings: {
        textStyle: 'scientific'
    }
});


const App: React.FC = () => {
  const [sessionState, setSessionState] = useState<Session>(getInitialSession());
  const { state: historyState, setState: setHistoryState, undo, redo, canUndo, canRedo, reset: resetHistory } = useHistoryState<Message[]>([]);

  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('voiceInkSettings');
      return savedSettings ? JSON.parse(savedSettings) : getDefaultSettings();
    } catch (e) {
      return getDefaultSettings();
    }
  });

  // Transcription and Media Stream state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'interlocutor'>('interlocutor');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [loadedAudio, setLoadedAudio] = useState<Blob | null>(null);

  // Modal and Panel visibility state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showNotebookLMInstructions, setShowNotebookLMInstructions] = useState(false);
  const [isStudioPanelCollapsed, setIsStudioPanelCollapsed] = useState(true);
  const [isSourcesPanelCollapsed, setIsSourcesPanelCollapsed] = useState(false);
  const [showAgentConfigModal, setShowAgentConfigModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showSearchSourcesModal, setShowSearchSourcesModal] = useState(false);
  const [sourceToRename, setSourceToRename] = useState<Source | null>(null);
  const [showStudioConfigModal, setShowStudioConfigModal] = useState(false);

  // UI interaction state
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  // AI and Data state
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => sessionStorage.getItem('geminiApiKey'));
  const [isProcessing, setIsProcessing] = useState({ summary: false, actionItems: false, topics: false, proofread: false, agent: false, entities: false });
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [isProcessingGuide, setIsProcessingGuide] = useState(false);
  const [processingTool, setProcessingTool] = useState<StudioToolId | null>(null);
  const [exportedFileName, setExportedFileName] = useState('session.txt');
  const [selectedStyle, setSelectedStyle] = useState<TextStyle>('default');
  const [selectedAIAgents, setSelectedAIAgents] = useState<{ expertise: AIAgentExpertise[], domains: AIAgentDomain[] }>({ expertise: [], domains: [] });
  const [insightsSectionState, setInsightsSectionState] = useState<InsightsSectionState>({ summary: true, actionItems: true, keyTopics: true, textAnalysis: true, textEditor: true, aiChat: true });
  
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const { sessions, saveSession, deleteSession, getSessionAudio, updateSession } = useSessionHistory();
  const lang = settings.language as Language;
  
  const messages = historyState;

  // Transcription hook setup
  const onFinalTranscript = useCallback((transcript: string) => {
      const newSpeaker = isPushToTalkActive ? 'user' : currentSpeaker;
      const newMessage: Message = {
          id: `msg-${Date.now()}`,
          text: transcript,
          timestamp: audioRef.current?.currentTime ?? 0,
          sender: newSpeaker
      };
      setHistoryState(currentMessages => [...currentMessages, newMessage]);
  }, [currentSpeaker, isPushToTalkActive, setHistoryState]);

  const onRecordingComplete = useCallback((audioBlob: Blob | null) => {
    setLoadedAudio(audioBlob);
    
    // Create transcription source if it doesn't exist
    setSessionState(produce(draft => {
        let transcription = draft.sources.find(s => s.type === 'transcription');
        if (!transcription) {
            transcription = { id: `source-transcription-${draft.id}`, name: 'Live Transcription', type: 'transcription', content: [] };
            draft.sources.push(transcription);
        }
        transcription.content = historyState;
        draft.hasAudio = !!audioBlob;
    }));

    saveSession({ ...sessionState, sources: produce(sessionState.sources, draft => {
        let transcription = draft.find(s => s.type === 'transcription');
        if (!transcription) {
            transcription = { id: `source-transcription-${sessionState.id}`, name: 'Live Transcription', type: 'transcription', content: [] };
            draft.push(transcription);
        }
        transcription.content = historyState;
    }) }, audioBlob);

  }, [sessionState, historyState, saveSession]);

  const { isListening, interimTranscript, startListening, stopListening, isSpeechRecognitionSupported, restartListening } = useTranscription({
      lang,
      onFinalTranscript,
      onRecordingComplete,
      mediaStream
  });
  
  useEffect(() => {
    localStorage.setItem('voiceInkSettings', JSON.stringify(settings));
    document.body.className = `theme-${settings.theme}`;
  }, [settings]);
  
  const startNewSession = (name: string, profileId: SessionProfileId, startRecording = false) => {
        const newSession = getInitialSession();
        newSession.name = name;
        newSession.profileId = profileId;
        newSession.settings = settings;
        newSession.activeTools = profiles[profileId].tools;
        
        setSessionState(newSession);
        resetHistory([]);
        setLoadedAudio(null);
        setPlaybackTime(0);
        if (startRecording) {
            handleStart();
        }
    };
    
    const handleStart = async () => {
        if (!isSpeechRecognitionSupported) {
            alert("Speech Recognition is not supported in your browser.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);
            setIsRecording(true);
            setIsPaused(false);
            
            // Ensure transcription source exists
            if (!sessionState.sources.some(s => s.type === 'transcription')) {
                 setSessionState(produce(draft => {
                     const newSource: Source = { id: `source-transcription-${draft.id}`, name: 'Live Transcription', type: 'transcription', content: [] };
                     draft.sources.push(newSource);
                     if (!draft.selectedSourceIds?.includes(newSource.id)) {
                         draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
                     }
                 }));
            }
        } catch (err) {
            console.error("Error getting media stream:", err);
            alert("Could not access microphone.");
        }
    };

    useEffect(() => {
        if (isRecording && mediaStream) {
            startListening();
        }
    }, [isRecording, mediaStream, startListening]);
    
    const handleStop = () => {
        setIsRecording(false);
        setIsPaused(false);
        stopListening();
        mediaStream?.getTracks().forEach(track => track.stop());
        setMediaStream(null);
    };

    const handleLoadSession = async (session: Session) => {
        const audioBlob = await getSessionAudio(session.id);
        const transcription = session.sources.find(s => s.type === 'transcription');
        const transcriptionMessages = (transcription?.content as Message[]) || [];

        setSessionState(session);
        resetHistory(transcriptionMessages);
        setLoadedAudio(audioBlob);
        setShowHistoryModal(false);
    };

    // Text selection handler
    useEffect(() => {
        const handleMouseUp = () => {
            if (editingMessageId) return;
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();
            if (selectedText) {
                const range = selection?.getRangeAt(0);
                const container = range?.commonAncestorContainer;
                const messageElement = (container?.nodeType === Node.ELEMENT_NODE ? (container as Element) : container?.parentElement)?.closest('[data-message-id]');
                const messageId = messageElement?.getAttribute('data-message-id');
                if (messageId) {
                    setSelectionContext({ messageId, text: selectedText });
                }
            } else {
                setSelectionContext(null);
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [editingMessageId]);

    const handleAddSource = useCallback(async (file: File | null, url: string) => {
        if (!geminiApiKey) {
            setShowApiKeyModal(true);
            return;
        }
        setIsProcessingSource(true);
        setShowAddSourceModal(false);

        const formData = new FormData();
        let sourceType: 'audio' | 'file' | 'url' | '' = '';
        let sourceName = '';

        if (file) {
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                alert(t('fileTooLargeError', lang, { maxSize: MAX_FILE_SIZE_MB }));
                setIsProcessingSource(false);
                return;
            }
            formData.append('file', file);
            sourceName = file.name;
            sourceType = file.type.startsWith('audio/') ? 'audio' : 'file';
        } else if (url) {
            formData.append('url', url);
            try {
                sourceName = new URL(url).hostname;
            } catch {
                sourceName = url;
            }
            sourceType = 'url';
        }
        formData.append('type', sourceType);

        try {
            const response = await fetch('/api/process-source', {
                method: 'POST',
                headers: { 'X-API-Key': geminiApiKey },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }
            const data = await response.json();
            const newSource: Source = {
                id: `source-${Date.now()}`,
                name: sourceName,
                type: sourceType as SourceType,
                content: data.content,
                isSelected: true
            };
            setSessionState(produce(draft => {
                draft.sources.push(newSource);
                draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
            }));
        } catch (error) {
            console.error('Error processing source:', error);
            alert(t('sourceProcessingError', lang));
        } finally {
            setIsProcessingSource(false);
        }
    }, [geminiApiKey, lang]);
    
    const handleToggleSourceSelection = (sourceId: string) => {
        setSessionState(produce(draft => {
            const currentSelected = draft.selectedSourceIds || [];
            if (currentSelected.includes(sourceId)) {
                draft.selectedSourceIds = currentSelected.filter(id => id !== sourceId);
            } else {
                draft.selectedSourceIds = [...currentSelected, sourceId];
            }
        }));
    };

    const handleToggleSelectAllSources = () => {
        setSessionState(produce(draft => {
            const allSourceIds = draft.sources.map(s => s.id);
            const currentSelected = draft.selectedSourceIds || [];
            if (currentSelected.length === allSourceIds.length) {
                draft.selectedSourceIds = [];
            } else {
                draft.selectedSourceIds = allSourceIds;
            }
        }));
    };

    const handleDeleteSource = (sourceId: string) => {
        setSessionState(produce(draft => {
            draft.sources = draft.sources.filter(s => s.id !== sourceId);
            if (draft.selectedSourceIds) {
                draft.selectedSourceIds = draft.selectedSourceIds.filter(id => id !== sourceId);
            }
        }));
    };

    const buildAIContext = useCallback((): string => {
        const selectedSources = sessionState.sources.filter(s => sessionState.selectedSourceIds?.includes(s.id));
        return selectedSources.map(source => {
            let contentString = '';
            if (source.type === 'transcription') {
                 contentString = historyState.map(msg => `${settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
            } else if (Array.isArray(source.content)) {
                contentString = source.content.map(msg => `${settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
            } else {
                contentString = source.content;
            }
            return `--- Source: ${source.name} (${source.type}) ---\n${contentString}`;
        }).join('\n\n');
    }, [sessionState.sources, sessionState.selectedSourceIds, settings, historyState]);
    
    const handleSplitMessage = () => {
        if (!selectionContext) return;
        const { messageId, text: selectedText } = selectionContext;

        setHistoryState(currentMessages => {
            const msgIndex = currentMessages.findIndex(m => m.id === messageId);
            if (msgIndex === -1) return currentMessages;

            const originalMessage = currentMessages[msgIndex];
            const selectionStartIndex = originalMessage.text.indexOf(selectedText);
            if (selectionStartIndex === -1) return currentMessages;
            
            const part1 = originalMessage.text.substring(0, selectionStartIndex).trim();
            const part2 = originalMessage.text.substring(selectionStartIndex).trim();

            const updatedMessages = [...currentMessages];
            if (part1) {
                updatedMessages[msgIndex] = { ...originalMessage, text: part1 };
                const newMessage: Message = {
                    id: `msg-${Date.now()}`,
                    text: part2,
                    timestamp: originalMessage.timestamp, // Keep same timestamp for now
                    sender: originalMessage.sender === 'user' ? 'interlocutor' : 'user',
                };
                updatedMessages.splice(msgIndex + 1, 0, newMessage);
            } else {
                 updatedMessages[msgIndex] = { ...originalMessage, sender: originalMessage.sender === 'user' ? 'interlocutor' : 'user' };
            }
            return updatedMessages;
        });
        setSelectionContext(null);
    };

    const handleSpeakerChangeOnSelection = (newSpeaker: 'user' | 'interlocutor') => {
        if (!selectionContext) return;
        setHistoryState(produce(draft => {
            const msg = draft.find(m => m.id === selectionContext.messageId);
            if (msg) msg.sender = newSpeaker;
        }));
        setSelectionContext(null);
    };

    const handleDeleteMessageOnSelection = () => {
        if (!selectionContext) return;
         setHistoryState(produce(draft => {
            const index = draft.findIndex(m => m.id === selectionContext.messageId);
            if (index > 0) {
                draft[index - 1].text += ' ' + draft[index].text;
                draft.splice(index, 1);
            } else if (index === 0 && draft.length > 1) {
                 draft.splice(index, 1);
            }
        }));
        setSelectionContext(null);
    };

    const handleEditMessage = () => {
        if (!selectionContext) return;
        setEditingMessageId(selectionContext.messageId);
        setSelectionContext(null);
    };

    const handleAskAIAgent = async (prompt: string) => {
        if (!geminiApiKey) { setShowApiKeyModal(true); return; }
        
        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            text: prompt,
            timestamp: -1, // Special flag for non-transcription chat messages
            sender: 'user',
        };
        setHistoryState(current => [...current, userMessage]);

        setIsProcessing(produce(draft => { draft.agent = true; }));
        try {
            const context = buildAIContext();
            
            const aiChatHistory: AIChatMessage[] = historyState
                .filter(m => m.timestamp === -1) // only chat messages
                .map(m => ({
                    role: m.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }],
                }));
            aiChatHistory.push({ role: 'user', parts: [{ text: prompt }] });

            const responseText = await getAgentResponse(geminiApiKey, context, selectedAIAgents, lang, aiChatHistory);
            
            const assistantMessage: Message = {
                id: `msg-${Date.now() + 1}`,
                text: responseText,
                timestamp: -1,
                sender: 'assistant',
            };
            setHistoryState(current => [...current, assistantMessage]);

        } catch (e) {
            alert(t('aiError', lang));
            setHistoryState(current => current.filter(m => m.id !== userMessage.id)); // Rollback user message on error
        } finally {
            setIsProcessing(produce(draft => { draft.agent = false; }));
        }
    };
    
    const handleTriggerTool = useCallback(async (toolId: StudioToolId) => {
        if (!geminiApiKey) {
            setShowApiKeyModal(true);
            return;
        }
        const context = buildAIContext();
        if (!context.trim()) {
            alert("Please select at least one source for analysis.");
            return;
        }

        let apiCall: ((...args: any[]) => Promise<string>) | null = null;
        let noteType = toolId;
        let noteTitleKey: keyof typeof translations['en'] = 'note';
        let icon;

        switch(toolId) {
            case 'emotionAnalysis':
                apiCall = (apiKey, context, lang) => getEmotionAnalysis(apiKey, context, lang);
                noteTitleKey = 'toolEmotionAnalysis';
                break;
            case 'tonalityAnalysis':
                apiCall = (apiKey, context, lang) => getTonalityAnalysis(apiKey, context, lang);
                noteTitleKey = 'toolTonalityAnalysis';
                break;
            case 'textStyle':
                const style = sessionState.toolSettings?.textStyle;
                if (style) {
                    apiCall = (apiKey, context, lang) => getStyledText(apiKey, context, style, lang);
                    noteTitleKey = 'toolTextStyle';
                }
                break;
        }

        if (apiCall) {
            setProcessingTool(toolId);
            try {
                const result = await apiCall(geminiApiKey, context, lang);
                const tool = studioTools[toolId];
                handleSaveToNote(t(noteTitleKey, lang), result, noteType, tool?.icon);
            } catch (e) {
                alert(t('aiError', lang));
            } finally {
                setProcessingTool(null);
            }
        } else {
            console.warn(`Tool ${toolId} is not yet implemented.`);
        }
    }, [geminiApiKey, lang, buildAIContext, sessionState.toolSettings]);

    const handleGenerateSourceGuide = async (sourceId: string) => {
        if (!geminiApiKey) {
          setShowApiKeyModal(true);
          return;
        }
        const source = sessionState.sources.find(s => s.id === sourceId);
        if (!source || source.guide) return;
    
        setIsProcessingGuide(true);
        try {
          const content = Array.isArray(source.content)
            ? source.content.map(m => m.text).join('\n')
            : source.content;
          
          const guide = await getSourceGuide(geminiApiKey, content, lang);
          
          setSessionState(produce(draft => {
            const targetSource = draft.sources.find(s => s.id === sourceId);
            if (targetSource) {
              targetSource.guide = guide;
            }
          }));
        } catch (e) {
          alert(t('aiError', lang));
        } finally {
          setIsProcessingGuide(false);
        }
    };
    
    const handleConvertToSource = (name: string, content: string) => {
        const newSource: Source = {
            id: `source-${Date.now()}`,
            name: name,
            type: 'file',
            content: content,
            isSelected: true,
        };
        setSessionState(produce(draft => {
            draft.sources.push(newSource);
            draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
        }));
    };
    
    const handleConvertNoteToSource = (noteId: string) => {
        const note = sessionState.notes?.find(n => n.id === noteId);
        if (!note) return;
        handleConvertToSource(note.title, note.content);
    };

    const handleConvertAllNotesToSource = () => {
        if (!sessionState.notes || sessionState.notes.length === 0) return;
        const combinedContent = sessionState.notes.map(note => `--- Note: ${note.title} ---\n${note.content}`).join('\n\n');
        const newSourceName = `${t('allNotes', lang)} - ${new Date().toLocaleDateString()}`;
        handleConvertToSource(newSourceName, combinedContent);
    };

    const handleDeleteNote = (noteId: string) => {
        setSessionState(produce(draft => {
            if (draft.notes) {
                draft.notes = draft.notes.filter(n => n.id !== noteId);
            }
        }));
    };

    const handleRenameNote = (noteId: string, newTitle: string) => {
        setSessionState(produce(draft => {
            if (draft.notes) {
                const note = draft.notes.find(n => n.id === noteId);
                if (note) {
                    note.title = newTitle;
                }
            }
        }));
    };

    const handleAddNewNote = (): string => {
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title: t('newNote', lang),
          content: '',
          type: 'manual', // A new type for user-created notes
          time: new Date().toISOString(),
        };
        let newNoteId = '';
        setSessionState(produce(draft => {
          if (!draft.notes) {
            draft.notes = [];
          }
          draft.notes.push(newNote);
          newNoteId = newNote.id;
        }));
        return newNoteId;
    };
    
    const handleUpdateNoteContent = (noteId: string, newContent: string) => {
        setSessionState(produce(draft => {
          const note = draft.notes?.find(n => n.id === noteId);
          if (note) {
            note.content = newContent;
          }
        }));
    };

    const handleSaveToNote = (title: string, content: string, type: string, icon?: React.FC) => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title,
            content,
            type,
            time: new Date().toISOString(),
            icon: icon,
        };
        setSessionState(produce(draft => {
            if (!draft.notes) {
                draft.notes = [];
            }
            draft.notes.push(newNote);
        }));
    };

    const handleUpdateActiveTools = (newTools: StudioToolId[]) => {
        setSessionState(produce(draft => {
            draft.activeTools = newTools;
        }));
    };

    const handleUpdateToolSettings = (toolId: StudioToolId, settings: any) => {
        setSessionState(produce(draft => {
            if (!draft.toolSettings) {
                draft.toolSettings = {};
            }
            (draft.toolSettings as any)[toolId] = settings;
        }));
    };
    
    const handleClear = () => {
        if(window.confirm(t('clearChatConfirmation', lang))) {
            const newSession = getInitialSession();
            newSession.settings = settings;
            setSessionState(newSession);
            resetHistory([]);
            setLoadedAudio(null);
            setPlaybackTime(0);
        }
    };

    return (
    <div className={`theme-${settings.theme} bg-[var(--bg-main)] text-[var(--text-primary)] h-screen w-screen flex flex-col`}>
      <div className="flex flex-grow min-h-0">
        <SourcesPanel
            isCollapsed={isSourcesPanelCollapsed}
            onToggleCollapse={() => setIsSourcesPanelCollapsed(p => !p)}
            sources={sessionState.sources}
            selectedSourceIds={sessionState.selectedSourceIds || []}
            onToggleSource={handleToggleSourceSelection}
            onToggleSelectAll={handleToggleSelectAllSources}
            onAddSourceClick={() => setShowAddSourceModal(true)}
            onSearchClick={() => setShowSearchSourcesModal(true)}
            onGenerateGuide={handleGenerateSourceGuide}
            isProcessingGuide={isProcessingGuide}
            onRenameSource={setSourceToRename}
            onDeleteSource={handleDeleteSource}
            lang={lang}
        />
        <main className={`flex-grow flex flex-col min-w-0 bg-slate-900`}>
          <Header
            onExport={() => setShowExportModal(true)}
            onClear={handleClear}
            onSettings={() => setShowSettingsModal(true)}
            onHistoryClick={() => setShowHistoryModal(true)}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onHelpClick={() => introJs().start()}
            lang={lang}
            isEditing={!!editingMessageId}
          />
          {selectionContext && (
            <TextEditorToolbar
              selection={selectionContext}
              onClose={() => setSelectionContext(null)}
              onSplit={handleSplitMessage}
              onSpeakerChange={handleSpeakerChangeOnSelection}
              onDelete={handleDeleteMessageOnSelection}
              onEdit={handleEditMessage}
              lang={lang}
            />
          )}
          {sessionState.sources.length > 0 && <SessionBar sessionName={sessionState.name} />}
          <ChatWindow
            ref={chatWindowRef}
            messages={messages}
            interimTranscript={interimTranscript}
            isRecording={isRecording}
            isProcessingFile={isProcessingSource}
            settings={settings}
            editingMessageId={editingMessageId}
            onUpdateMessage={(id, text) => {
                setHistoryState(produce(draft => {
                    const msg = draft.find(m => m.id === id);
                    if (msg) msg.text = text;
                }));
                setEditingMessageId(null);
            }}
            onCancelEdit={() => setEditingMessageId(null)}
            lang={lang}
            playbackTime={playbackTime}
            onSeekAudio={(time) => { if(audioRef.current) audioRef.current.currentTime = time; }}
            onSaveToNote={handleSaveToNote}
            entities={sessionState.analysisResult?.entities}
          />
          <div className="flex-shrink-0">
            <AudioPlayer
                ref={audioRef}
                blob={loadedAudio}
                onTimeUpdate={setPlaybackTime}
                isVisible={sessionState.hasAudio}
            />
            <MainAIChatInput 
                onAskAIAgent={handleAskAIAgent}
                isProcessing={isProcessing.agent}
                lang={lang}
                onAgentConfigClick={() => setShowAgentConfigModal(true)}
            />
            <TranscriptionControls
                isRecording={isRecording}
                isPaused={isPaused}
                isPushToTalkActive={isPushToTalkActive}
                isAIAssistantOpen={!isStudioPanelCollapsed}
                onStartClick={() => {
                    if (sessionState.sources.length > 0 && historyState.length > 0) {
                        if (window.confirm(t('startNewSessionConfirmation', lang))) {
                            setShowNewSessionModal(true);
                        }
                    } else {
                        setShowNewSessionModal(true);
                    }
                }}
                onStopClick={handleStop}
                onPauseClick={() => {
                    if (isPaused) restartListening();
                    else restartListening();
                    setIsPaused(!isPaused);
                }}
                onMicToggle={() => setIsPushToTalkActive(p => !p)}
                onAIToggle={() => setIsStudioPanelCollapsed(p => !p)}
                lang={lang}
            />
          </div>
        </main>
        <StudioPanel
            isCollapsed={isStudioPanelCollapsed}
            onToggleCollapse={() => setIsStudioPanelCollapsed(p => !p)}
            isSessionLoaded={sessionState.sources.length > 0}
            session={sessionState}
            notes={sessionState.notes || []}
            onDeleteNote={handleDeleteNote}
            onConvertToSource={handleConvertNoteToSource}
            onConvertAllNotesToSource={handleConvertAllNotesToSource}
            onRenameNote={handleRenameNote}
            onAddNewNote={handleAddNewNote}
            onUpdateNoteContent={handleUpdateNoteContent}
            onConfigureToolsClick={() => setShowStudioConfigModal(true)}
            onTriggerTool={handleTriggerTool}
            processingTool={processingTool}
            toolSettings={sessionState.toolSettings}
            onUpdateToolSettings={handleUpdateToolSettings}
            lang={lang}
        />
      </div>

      {showStudioConfigModal && <StudioConfigModal 
        onClose={() => setShowStudioConfigModal(false)}
        onSave={handleUpdateActiveTools}
        activeTools={sessionState.activeTools || []}
        lang={lang}
      />}
      {showAddSourceModal && <AddSourceModal 
        onClose={() => setShowAddSourceModal(false)} 
        onAdd={handleAddSource} 
        lang={lang} 
        onSearchClick={() => {
            setShowAddSourceModal(false);
            setShowSearchSourcesModal(true);
        }}
        sourcesCount={sessionState.sources.length}
      />}
      {showSearchSourcesModal && <SearchSourcesModal 
        onClose={() => setShowSearchSourcesModal(false)}
        onSearch={(query, searchIn) => {
          console.log("Searching for:", query, "in", searchIn);
          setShowSearchSourcesModal(false);
        }}
        lang={lang}
      />}
      {sourceToRename && <RenameSourceModal source={sourceToRename} onClose={() => setSourceToRename(null)} onSave={(id, name) => {
          setSessionState(produce(draft => {
              const source = draft.sources.find(s => s.id === id);
              if (source) source.name = name;
          }));
          setSourceToRename(null);
      }} lang={lang} />}
      {showAgentConfigModal && <AgentConfigModal 
        initialSelectedAgents={selectedAIAgents} 
        onClose={() => setShowAgentConfigModal(false)} 
        onSave={setSelectedAIAgents} 
        lang={lang}
        profileId={sessionState.profileId}
      />}
      {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} onSave={(key) => { sessionStorage.setItem('geminiApiKey', key); setGeminiApiKey(key); setShowApiKeyModal(false); }} lang={lang} />}
      {showNewSessionModal && <NewSessionModal onClose={() => setShowNewSessionModal(false)} onConfirm={(name, profileId) => {
          setShowNewSessionModal(false);
          startNewSession(name, profileId, true);
      }} lang={lang} />}
      {showHistoryModal && <HistoryModal sessions={sessions} onClose={() => setShowHistoryModal(false)} onLoad={handleLoadSession} onDelete={deleteSession} onSaveAudio={async (id) => {
          const blob = await getSessionAudio(id);
          if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${sessions.find(s => s.id === id)?.name || 'audio'}.webm`;
              a.click();
              URL.revokeObjectURL(url);
          }
      }} lang={lang} />}
    </div>
  );
};

export default App;