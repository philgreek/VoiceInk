
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscription } from './hooks/useTranscription';
import { Message, Session, Settings, Insight, Source, SessionProfileId, Note, StudioToolId, Citation, SelectionContext, SourceType, AIChatMessage } from './types';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { TranscriptionControls } from './components/TranscriptionControls';
import { SettingsModal } from './components/SettingsModal';
import { NewSessionModal } from './components/NewSessionModal';
import { HistoryDropdown } from './components/HistoryDropdown';
import { StudioPanel } from './components/StudioPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AgentConfigModal } from './components/AgentConfigModal';
import { produce } from 'immer';
import { t, Language } from './utils/translations';
import { useHistoryState } from './hooks/useHistoryState';
import { useSessionHistory } from './hooks/useSessionHistory';
import { usePrompts } from './hooks/usePrompts';
import { AudioPlayer } from './components/AudioPlayer';
import introJs from 'intro.js';
import { getAgentResponse, getSourceGuide, getEmotionAnalysis, getTonalityAnalysis, getStyledText, getBrainstormIdeas, getGrammarCheck, getDiscussionForTopic, getInsightsForText } from './utils/gemini';
import { SourcesPanel } from './components/SourcesPanel';
import { AddSourceModal } from './components/AddSourceModal';
import { MainAIChatInput } from './components/MainAIChatInput';
import { TextEditorToolbar } from './components/TextEditorToolbar';
import { RenameSourceModal } from './components/RenameSourceModal';
import { SearchSourcesModal } from './components/SearchSourcesModal';
import { profiles } from './utils/profiles';
import { StudioConfigModal } from './components/StudioConfigModal';
import { PromptWizardModal } from './components/PromptWizardModal';
import { SavePromptModal } from './components/SavePromptModal';
import { RefreshCwIcon } from './components/icons';
import JSZip from 'jszip';

const MAX_FILE_SIZE_MB = 4.5;

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => void;
}


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
    profileId: 'pedagogical',
    messages: [],
    sources: [],
    notes: [],
    settings: getDefaultSettings(),
    savedAt: new Date().toISOString(),
    hasAudio: false,
    analysisResult: null,
    selectedSourceIds: [],
    activeTools: profiles['pedagogical'].tools,
    toolSettings: {
        textStyle: 'scientific'
    },
    agentConfig: { expertise: [], domains: [] },
    highlightFragment: null,
    insights: [],
    isInsightModeActive: false,
});


const App: React.FC = () => {
  const { state: session, setState: setSession, undo, redo, canUndo, canRedo, reset: resetSession } = useHistoryState<Session>(getInitialSession());
  
  // Transcription and Media Stream state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'interlocutor'>('interlocutor');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [loadedAudio, setLoadedAudio] = useState<Blob | null>(null);

  // Modal and Panel visibility state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isStudioPanelCollapsed, setIsStudioPanelCollapsed] = useState(true);
  const [isSourcesPanelCollapsed, setIsSourcesPanelCollapsed] = useState(false);
  const [showAgentConfigModal, setShowAgentConfigModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [showSearchSourcesModal, setShowSearchSourcesModal] = useState(false);
  const [sourceToRename, setSourceToRename] = useState<Source | null>(null);
  const [showStudioConfigModal, setShowStudioConfigModal] = useState(false);
  const [showPromptWizardModal, setShowPromptWizardModal] = useState(false);
  const [showSavePromptModal, setShowSavePromptModal] = useState(false);


  // UI interaction state
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [mainInputText, setMainInputText] = useState('');
  const [promptToSave, setPromptToSave] = useState<string | null>(null);

  
  // AI and Data state
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => sessionStorage.getItem('geminiApiKey'));
  const [isProcessingAgent, setIsProcessingAgent] = useState(false);
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [isProcessingGuide, setIsProcessingGuide] = useState(false);
  const [processingTool, setProcessingTool] = useState<StudioToolId | null>(null);
  const [isProcessingInsights, setIsProcessingInsights] = useState(false);

  // Discussion state
  const [activeDiscussionTopic, setActiveDiscussionTopic] = useState<string | null>(null);
  const [isProcessingDiscussion, setIsProcessingDiscussion] = useState(false);
  
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const promptImportFileRef = useRef<HTMLInputElement>(null);
  const { sessions, saveSession, deleteSession, getSessionAudio, importSession } = useSessionHistory();
  const { prompts, addPrompt, updatePrompt, deletePrompt, importPrompts } = usePrompts();
  const lang = session.settings.language as Language;
  
  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce((sessionToSave: Session, audio: Blob | null) => {
      saveSession(sessionToSave, audio);
    }, 1500),
    [saveSession] 
  );
  
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    debouncedSave(session, loadedAudio);
  }, [session, loadedAudio, debouncedSave]);


  // Transcription hook setup
  const onFinalTranscript = useCallback((transcript: string) => {
      const newSpeaker = isPushToTalkActive ? 'user' : currentSpeaker;
      const newMessage: Message = {
          id: `msg-${Date.now()}`,
          text: transcript,
          timestamp: audioRef.current?.currentTime ?? 0,
          sender: newSpeaker
      };
      setSession(produce(draft => {
        draft.messages.push(newMessage);
        
        let transcription = draft.sources.find(s => s.type === 'transcription');
        if (transcription) {
            (transcription.content as Message[]).push(newMessage);
        }
      }));
  }, [currentSpeaker, isPushToTalkActive, setSession]);

  const onRecordingComplete = useCallback((audioBlob: Blob | null) => {
    setLoadedAudio(audioBlob);
    
    setSession(produce(draft => {
        let transcriptionSource = draft.sources.find(s => s.type === 'transcription');
        if (!transcriptionSource) {
            transcriptionSource = { id: `source-transcription-${draft.id}`, name: 'Live Transcription', type: 'transcription', content: [] };
            draft.sources.push(transcriptionSource);
        }
        transcriptionSource.content = draft.messages.filter(m => m.timestamp !== -1);
        draft.hasAudio = !!audioBlob;
    }));
    
    if (audioBlob) {
        saveSession(session, audioBlob);
    }
  }, [session, saveSession]);

  const { isListening, interimTranscript, startListening, stopListening, isSpeechRecognitionSupported, pauseListening, resumeListening } = useTranscription({
      lang,
      onFinalTranscript,
      onRecordingComplete,
      mediaStream
  });
  
  useEffect(() => {
    localStorage.setItem('voiceInkSettings', JSON.stringify(session.settings));
    document.body.className = `theme-${session.settings.theme}`;
  }, [session.settings]);
  
  const startNewSession = (name: string, profileId: SessionProfileId, startRecording = false) => {
        const newSession = getInitialSession();
        newSession.name = name;
        newSession.profileId = profileId;
        newSession.settings = session.settings; // Keep user settings
        newSession.activeTools = profiles[profileId].tools;
        
        resetSession(newSession);
        setLoadedAudio(null);
        setPlaybackTime(0);
        setMainInputText('');
        setActiveDiscussionTopic(null);

        if (startRecording) {
            handleContinueRecording();
        }
    };
    
    const handleContinueRecording = async () => {
        if (!isSpeechRecognitionSupported) {
            alert("Speech Recognition is not supported in your browser.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);
            setIsRecording(true);
            setIsPaused(false);
            
            setSession(produce(draft => {
                if (!draft.sources.some(s => s.type === 'transcription')) {
                     const newSource: Source = { id: `source-transcription-${draft.id}`, name: 'Live Transcription', type: 'transcription', content: [] };
                     draft.sources.push(newSource);
                     if (!draft.selectedSourceIds?.includes(newSource.id)) {
                         draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
                     }
                }
            }));
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

    const handleLoadSession = async (sessionToLoad: Session) => {
        const audioBlob = await getSessionAudio(sessionToLoad.id);
        
        const defaultSession = getInitialSession();
        const mergedSession = { ...defaultSession, ...sessionToLoad };

        const loadedSessionState = produce(mergedSession, draft => {
            draft.settings = session.settings;
        });

        resetSession(loadedSessionState);
        setLoadedAudio(audioBlob);
        setShowHistoryDropdown(false);
        setMainInputText('');
        setActiveDiscussionTopic(null);
    };

    const handleExportSession = async (sessionId: string) => {
        const sessionToExport = sessionId === session.id ? session : sessions.find(s => s.id === sessionId);

        if (!sessionToExport) {
            console.error("Session not found for export");
            return;
        }

        const audioBlob = await getSessionAudio(sessionId);
        const zip = new JSZip();

        const cleanSession = produce(sessionToExport, draft => {
            draft.sources.forEach(s => delete s.isSelected);
        });
        
        zip.file("session.json", JSON.stringify(cleanSession, null, 2));

        if (audioBlob) {
            zip.file("audio.webm", audioBlob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        const safeName = sessionToExport.name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '_').replace(/__+/g, '_');
        link.download = `voiceink_session_${safeName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const handleImportSession = () => {
        importFileRef.current?.click();
    };

    const onFileImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const importedSession = await importSession(file);
            handleLoadSession(importedSession);
            alert('Session imported successfully!');
        } catch (error) {
            console.error("Failed to import session:", error);
            alert(`Failed to import session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            if(event.target) event.target.value = '';
        }
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
            setSession(produce(draft => {
                draft.sources.push(newSource);
                draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
            }));
        } catch (error) {
            console.error('Error processing source:', error);
            alert(t('sourceProcessingError', lang));
        } finally {
            setIsProcessingSource(false);
        }
    }, [geminiApiKey, lang, setSession]);
    
    const handleToggleSourceSelection = (sourceId: string) => {
        setSession(produce(draft => {
            const currentSelected = draft.selectedSourceIds || [];
            if (currentSelected.includes(sourceId)) {
                draft.selectedSourceIds = currentSelected.filter(id => id !== sourceId);
            } else {
                draft.selectedSourceIds = [...currentSelected, sourceId];
            }
        }));
    };

    const handleToggleSelectAllSources = () => {
        setSession(produce(draft => {
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
        setSession(produce(draft => {
            draft.sources = draft.sources.filter(s => s.id !== sourceId);
            if (draft.selectedSourceIds) {
                draft.selectedSourceIds = draft.selectedSourceIds.filter(id => id !== sourceId);
            }
        }));
    };

    const buildAIContext = useCallback((): string => {
        const selectedSources = session.sources.filter(s => session.selectedSourceIds?.includes(s.id));
        return selectedSources.map(source => {
            let contentString = '';
            if (source.type === 'transcription' || Array.isArray(source.content)) {
                 contentString = (source.content as Message[]).map(msg => `${session.settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
            } else {
                contentString = source.content;
            }
            return `--- Source: ${source.name} (${source.type}) ---\n${contentString}`;
        }).join('\n\n');
    }, [session.sources, session.selectedSourceIds, session.settings]);
    
    const handleSplitMessage = () => {
        if (!selectionContext) return;
        const { messageId, text: selectedText } = selectionContext;

        setSession(produce(draft => {
            const msgIndex = draft.messages.findIndex(m => m.id === messageId);
            if (msgIndex === -1) return;

            const originalMessage = draft.messages[msgIndex];
            const selectionStartIndex = originalMessage.text.indexOf(selectedText);
            if (selectionStartIndex === -1) return;
            
            const part1 = originalMessage.text.substring(0, selectionStartIndex).trim();
            const part2 = originalMessage.text.substring(selectionStartIndex).trim();

            if (part1) {
                originalMessage.text = part1;
                const newMessage: Message = {
                    id: `msg-${Date.now()}`,
                    text: part2,
                    timestamp: originalMessage.timestamp,
                    sender: originalMessage.sender === 'user' ? 'interlocutor' : 'user',
                };
                draft.messages.splice(msgIndex + 1, 0, newMessage);
            } else {
                 originalMessage.sender = originalMessage.sender === 'user' ? 'interlocutor' : 'user';
            }
        }));
        setSelectionContext(null);
    };

    const handleSpeakerChangeOnSelection = (newSpeaker: 'user' | 'interlocutor') => {
        if (!selectionContext) return;
        setSession(produce(draft => {
            const msg = draft.messages.find(m => m.id === selectionContext.messageId);
            if (msg) msg.sender = newSpeaker;
        }));
        setSelectionContext(null);
    };

    const handleDeleteMessageOnSelection = () => {
        if (!selectionContext) return;
        setSession(produce(draft => {
            const index = draft.messages.findIndex(m => m.id === selectionContext.messageId);
            if (index > -1) {
                draft.messages.splice(index, 1);
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
    
        const userMessageForDisplay: Message = {
            id: `msg-user-${Date.now()}`,
            text: prompt,
            timestamp: -1,
            sender: 'user',
        };
    
        const assistantPlaceholder: Message = {
            id: `msg-assistant-${Date.now()}`,
            text: '...', // Special placeholder for thinking
            timestamp: -1,
            sender: 'assistant',
        };
    
        const aiChatHistory: AIChatMessage[] = session.messages
            .filter(m => m.timestamp === -1) // only chat messages
            .map((m) => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }],
            }));
        aiChatHistory.push({ role: 'user', parts: [{ text: prompt }] });
    
        setSession(produce(draft => {
            draft.messages.push(userMessageForDisplay);
            draft.messages.push(assistantPlaceholder);
        }));
    
        setIsProcessingAgent(true);
        setMainInputText(''); 
    
        try {
            const context = buildAIContext();
            
            const responseText = await getAgentResponse(geminiApiKey, context, session.agentConfig, lang, aiChatHistory, activeDiscussionTopic || undefined);
            
            setSession(produce(draft => {
                const msgToUpdate = draft.messages.find(m => m.id === assistantPlaceholder.id);
                if (msgToUpdate) {
                    msgToUpdate.text = responseText;
                }
            }));
    
        } catch (e) {
            alert(t('aiError', lang));
            setSession(produce(draft => {
                draft.messages = draft.messages.filter(m => m.id !== userMessageForDisplay.id && m.id !== assistantPlaceholder.id);
            }));
        } finally {
            setIsProcessingAgent(false);
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
        let noteTitleKey: Parameters<typeof t>[0] = 'note';
        
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
                const style = session.toolSettings?.textStyle;
                if (style) {
                    apiCall = (apiKey, context, lang) => getStyledText(apiKey, context, style, lang);
                    noteTitleKey = 'toolTextStyle';
                }
                break;
            case 'brainstorm':
                apiCall = (apiKey, context, lang) => getBrainstormIdeas(apiKey, context, lang);
                noteTitleKey = 'toolBrainstorm';
                break;
            case 'grammarCheck':
                apiCall = (apiKey, context, lang) => getGrammarCheck(apiKey, context, lang);
                noteTitleKey = 'toolGrammarCheck';
                break;
        }

        if (apiCall) {
            setProcessingTool(toolId);
            try {
                const result = await apiCall(geminiApiKey, context, lang);
                handleSaveToNote(t(noteTitleKey, lang), result, noteType);
            } catch (e) {
                alert(t('aiError', lang));
            } finally {
                setProcessingTool(null);
            }
        } else {
            console.warn(`Tool ${toolId} is not yet implemented.`);
        }
    }, [geminiApiKey, lang, buildAIContext, session.toolSettings, setSession]);

    const handleGenerateSourceGuide = async (sourceId: string) => {
        if (!geminiApiKey) {
          setShowApiKeyModal(true);
          return;
        }
        const source = session.sources.find(s => s.id === sourceId);
        if (!source || source.guide) return;
    
        setIsProcessingGuide(true);
        try {
          const content = Array.isArray(source.content)
            ? source.content.map(m => m.text).join('\n')
            : source.content;
          
          const guide = await getSourceGuide(geminiApiKey, content, lang);
          
          setSession(produce(draft => {
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
    
    const handleConvertNoteToSource = (noteId: string) => {
        const note = session.notes?.find(n => n.id === noteId);
        if (!note) return;
        const newSource: Source = {
            id: `source-${Date.now()}`,
            name: note.title,
            type: 'file',
            content: note.content,
            isSelected: true,
        };
        setSession(produce(draft => {
            draft.sources.push(newSource);
            draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
        }));
    };

    const handleConvertAllNotesToSource = () => {
        if (!session.notes || session.notes.length === 0) return;
        const combinedContent = session.notes.map(note => `--- Note: ${note.title} ---\n${note.content}`).join('\n\n');
        const newSourceName = `${t('allNotes', lang)} - ${new Date().toLocaleDateString()}`;
        const newSource: Source = {
            id: `source-${Date.now()}`,
            name: newSourceName,
            type: 'file',
            content: combinedContent,
            isSelected: true,
        };
         setSession(produce(draft => {
            draft.sources.push(newSource);
            draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
        }));
    };

    const handleDeleteNote = (noteId: string) => {
        setSession(produce(draft => {
            if (draft.notes) {
                draft.notes = draft.notes.filter(n => n.id !== noteId);
            }
        }));
    };

    const handleRenameNote = (noteId: string, newTitle: string) => {
        setSession(produce(draft => {
            const note = draft.notes?.find(n => n.id === noteId);
            if (note) note.title = newTitle;
        }));
    };

    const handleAddNewNote = (): string => {
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title: t('newNote', lang),
          content: '',
          type: 'manual',
          time: new Date().toISOString(),
        };
        let newNoteId = '';
        setSession(produce(draft => {
          if (!draft.notes) draft.notes = [];
          draft.notes.push(newNote);
          newNoteId = newNote.id;
        }));
        return newNoteId;
    };
    
    const handleUpdateNoteContent = (noteId: string, newContent: string) => {
        setSession(produce(draft => {
          const note = draft.notes?.find(n => n.id === noteId);
          if (note) note.content = newContent;
        }));
    };

    const handleSaveToNote = (title: string, content: string, type: string) => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title,
            content,
            type,
            time: new Date().toISOString(),
        };
        setSession(produce(draft => {
            if (!draft.notes) draft.notes = [];
            draft.notes.push(newNote);
        }));
    };

    const handleUpdateActiveTools = (newTools: StudioToolId[]) => {
        setSession(produce(draft => {
            draft.activeTools = newTools;
        }));
    };

    const handleUpdateToolSettings = (toolId: StudioToolId, settings: any) => {
        setSession(produce(draft => {
            if (!draft.toolSettings) {
                draft.toolSettings = {};
            }
            if (toolId === 'textStyle') {
                draft.toolSettings.textStyle = settings;
            }
        }));
    };
    
    const handleClear = () => {
        if(window.confirm(t('clearChatConfirmation', lang))) {
            startNewSession(t('sessionNameDefault', lang), 'pedagogical', false);
        }
    };
    
    const handleRenameSession = (newName: string) => {
        setSession(produce(draft => {
            draft.name = newName;
        }));
    };

    const handleUsePrompt = (text: string) => {
        setMainInputText(text);
        setShowPromptWizardModal(false);
    };

    const handleOpenSavePromptModal = (text: string) => {
        setPromptToSave(text);
        setShowSavePromptModal(true);
        setShowPromptWizardModal(false); // Close wizard if open
    };

    const handleSavePrompt = (name: string, category: string, text: string) => {
        addPrompt({
            id: `prompt-${Date.now()}`,
            name,
            category,
            text,
            createdAt: new Date().toISOString()
        });
        setShowSavePromptModal(false);
        setPromptToSave(null);
    };

    const handleExportPrompts = async () => {
        if (prompts.length === 0) {
          alert('Prompt library is empty.');
          return;
        }
        const zip = new JSZip();
        zip.file("prompts.json", JSON.stringify(prompts, null, 2));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `voiceink_prompts.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const handleImportPrompts = () => {
        promptImportFileRef.current?.click();
    };

    const onPromptFileImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        try {
            const zip = await JSZip.loadAsync(file);
            const promptsFile = zip.file('prompts.json');
            if (!promptsFile) {
                throw new Error('prompts.json not found in the archive.');
            }
            const promptsDataString = await promptsFile.async('string');
            const importedData = JSON.parse(promptsDataString);
            if (!Array.isArray(importedData)) {
                throw new Error('Invalid prompts file format.');
            }
            await importPrompts(importedData);
            alert('Prompts imported successfully!');
        } catch (error) {
            console.error("Failed to import prompts:", error);
            alert(`Failed to import prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            if(event.target) event.target.value = '';
        }
    };
    
    const handleStartDiscussion = useCallback(async (topic: string) => {
        if (!geminiApiKey) {
            setShowApiKeyModal(true);
            return;
        }
        const context = buildAIContext();
        if (!context.trim()) {
            alert("Please select at least one source for analysis.");
            return;
        }

        setIsProcessingDiscussion(true);
        setActiveDiscussionTopic(topic);
        
        const thinkingMessage: Message = {
            id: `msg-user-${Date.now()}`,
            text: `${t('discussTopic', lang)}: ${topic}`,
            timestamp: -1,
            sender: 'user',
        };

        const assistantPlaceholder: Message = {
            id: `msg-assistant-${Date.now()}`,
            text: '...',
            timestamp: -1,
            sender: 'assistant',
        };

        setSession(produce(draft => { 
            draft.messages.push(thinkingMessage);
            draft.messages.push(assistantPlaceholder);
        }));

        try {
            const rawText = await getDiscussionForTopic(geminiApiKey, topic, context, lang);
            
            const citations: Citation[] = [];
            const citationRegex = /\{\{cite: "([^"]+)"\}\}/g;
            
            const findSourceForFragment = (fragment: string) => {
                 const selectedSources = session.sources.filter(s => session.selectedSourceIds?.includes(s.id));
                 for (const source of selectedSources) {
                     const content = Array.isArray(source.content) ? source.content.map(m=>m.text).join('\n') : source.content;
                     if(content.includes(fragment)) {
                         return source.id;
                     }
                 }
                 return null;
            }

            let htmlContent = rawText.replace(citationRegex, (match, fragment) => {
                const sourceId = findSourceForFragment(fragment);
                if (sourceId) {
                    const citation: Citation = { index: citations.length + 1, sourceId, fragment };
                    citations.push(citation);
                    return `{{CITATION:${citations.length - 1}}}`;
                }
                return '';
            });

            htmlContent = htmlContent
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br />');

            setSession(produce(draft => { 
                const msgToUpdate = draft.messages.find(m => m.id === assistantPlaceholder.id);
                if (msgToUpdate) {
                    msgToUpdate.text = htmlContent;
                    msgToUpdate.discussion = true;
                    msgToUpdate.citations = citations;
                }
            }));

        } catch (error: any) {
            const errorMessage = error?.status === 429
                ? t('rateLimitError', lang)
                : t('aiError', lang);
            
            setSession(produce(draft => { 
                const msgToUpdate = draft.messages.find(m => m.id === assistantPlaceholder.id);
                if (msgToUpdate) {
                    msgToUpdate.text = `**Error:** ${errorMessage}`;
                }
            }));
        } finally {
            setIsProcessingDiscussion(false);
        }
    }, [geminiApiKey, buildAIContext, lang, setSession, session.sources, session.selectedSourceIds]);
    
    const handleCitationClick = (citation: Citation) => {
        setSession(produce(draft => {
            draft.highlightFragment = { sourceId: citation.sourceId, fragment: citation.fragment };
        }));
        if (isSourcesPanelCollapsed) {
            setIsSourcesPanelCollapsed(false);
        }
    };
    
    const handleToggleInsightMode = async () => {
        const currentlyActive = session.isInsightModeActive;

        if (currentlyActive) {
            setSession(produce(draft => {
                draft.isInsightModeActive = false;
                if(draft.insights) draft.insights = [];
            }));
            return;
        }

        if (!geminiApiKey) {
            setShowApiKeyModal(true);
            return;
        }

        setIsProcessingInsights(true);
        try {
            const sourceContext = buildAIContext();
            const chatContext = session.messages.map(m => m.text).join('\n\n');
            const fullText = `${sourceContext}\n\n${chatContext}`;

            if (!fullText.trim()) {
                setIsProcessingInsights(false);
                return;
            }

            const insights = await getInsightsForText(geminiApiKey, fullText, lang);
            setSession(produce(draft => {
                draft.insights = insights;
                draft.isInsightModeActive = true;
            }));

        } catch (error: any) {
             const errorMessage = error?.status === 429
                ? t('rateLimitError', lang)
                : t('aiError', lang);
            alert(`${t('insightMode', lang)} Error: ${errorMessage}`);
        } finally {
            setIsProcessingInsights(false);
        }
    };


    return (
    <div className={`theme-${session.settings.theme} bg-[var(--bg-main)] text-[var(--text-primary)] h-screen w-screen flex flex-col p-4 pt-0 gap-4`}>
        <Header
            sessionName={session.name}
            onRenameSession={handleRenameSession}
            onSettings={() => setShowSettingsModal(true)}
            onHistoryClick={(event) => {
                event.stopPropagation();
                setShowHistoryDropdown(p => !p)
            }}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onHelpClick={() => introJs().start()}
            lang={lang}
            isEditing={!!editingMessageId}
        />
        {showHistoryDropdown && <HistoryDropdown 
            sessions={sessions} 
            onClose={() => setShowHistoryDropdown(false)} 
            onLoad={handleLoadSession} 
            onDelete={deleteSession} 
            onSaveAudio={async (id) => {
                const blob = await getSessionAudio(id);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${sessions.find(s => s.id === id)?.name || 'audio'}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }}
            onExportSession={handleExportSession}
            onImportSession={handleImportSession}
            lang={lang}
        />}
        <div className="flex flex-grow min-h-0 gap-4">
            <SourcesPanel
                isCollapsed={isSourcesPanelCollapsed}
                onToggleCollapse={() => setIsSourcesPanelCollapsed(p => !p)}
                session={session}
                onToggleSource={handleToggleSourceSelection}
                onToggleSelectAll={handleToggleSelectAllSources}
                onAddSourceClick={() => setShowAddSourceModal(true)}
                onSearchClick={() => setShowSearchSourcesModal(true)}
                onGenerateGuide={handleGenerateSourceGuide}
                isProcessingGuide={isProcessingGuide}
                onRenameSource={setSourceToRename}
                onDeleteSource={handleDeleteSource}
                onStartDiscussion={handleStartDiscussion}
                onClearHighlight={() => setSession(produce(draft => { draft.highlightFragment = null; }))}
                lang={lang}
                isProcessingDiscussion={isProcessingDiscussion}
            />
            <main className="flex-grow flex flex-col min-w-0 bg-[var(--bg-surface)] rounded-lg shadow-md relative basis-1/2">
              <header className="p-4 flex justify-between items-center border-b border-[var(--border-color)] flex-shrink-0 h-[60px]">
                <h2 className="text-xl font-bold text-slate-100">{t('chat', lang)}</h2>
                <button 
                  onClick={handleClear}
                  disabled={isRecording || isPaused}
                  className="p-2 flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-element-hover)] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={t('clearChat', lang)}
                >
                  <RefreshCwIcon className="w-4 h-4" />
                </button>
              </header>

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
              <ChatWindow
                ref={chatWindowRef}
                session={session}
                interimTranscript={interimTranscript}
                isRecording={isRecording}
                isProcessingFile={isProcessingSource}
                editingMessageId={editingMessageId}
                onUpdateMessage={(id, text) => {
                    setSession(produce(draft => {
                        const msg = draft.messages.find(m => m.id === id);
                        if (msg) msg.text = text;
                    }));
                    setEditingMessageId(null);
                }}
                onCancelEdit={() => setEditingMessageId(null)}
                lang={lang}
                playbackTime={playbackTime}
                onSeekAudio={(time) => { if(audioRef.current) audioRef.current.currentTime = time; }}
                onSaveToNote={handleSaveToNote}
                onCitationClick={handleCitationClick}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-20">
                    <div className="relative space-y-2">
                        <AudioPlayer
                            ref={audioRef}
                            blob={loadedAudio}
                            onTimeUpdate={setPlaybackTime}
                            isVisible={session.hasAudio}
                        />
                         <div className="flex items-stretch gap-2 p-2 bg-slate-800/70 backdrop-blur-md rounded-full shadow-lg border border-slate-700">
                             <TranscriptionControls
                                isRecording={isRecording}
                                isPaused={isPaused}
                                isPushToTalkActive={isPushToTalkActive}
                                onStartClick={() => setShowNewSessionModal(true)}
                                onStopClick={handleStop}
                                onPauseClick={() => {
                                    if (isPaused) {
                                        resumeListening();
                                    } else {
                                        pauseListening();
                                    }
                                    setIsPaused(!isPaused);
                                }}
                                onMicToggle={() => setIsPushToTalkActive(p => !p)}
                                lang={lang}
                            />
                            <MainAIChatInput 
                                value={mainInputText}
                                onChange={setMainInputText}
                                onAskAIAgent={() => handleAskAIAgent(mainInputText)}
                                isProcessing={isProcessingAgent}
                                lang={lang}
                                onAgentConfigClick={() => setShowAgentConfigModal(true)}
                                onSavePromptClick={() => handleOpenSavePromptModal(mainInputText)}
                                onToggleInsightMode={handleToggleInsightMode}
                                isInsightModeActive={session.isInsightModeActive || false}
                                isProcessingInsights={isProcessingInsights}
                            />
                        </div>
                    </div>
              </div>
            </main>
            <StudioPanel
                isCollapsed={isStudioPanelCollapsed}
                onToggleCollapse={() => setIsStudioPanelCollapsed(p => !p)}
                session={session}
                onDeleteNote={handleDeleteNote}
                onConvertToSource={handleConvertNoteToSource}
                onConvertAllNotesToSource={handleConvertAllNotesToSource}
                onRenameNote={handleRenameNote}
                onAddNewNote={handleAddNewNote}
                onUpdateNoteContent={handleUpdateNoteContent}
                onConfigureToolsClick={() => setShowStudioConfigModal(true)}
                onTriggerTool={handleTriggerTool}
                processingTool={processingTool}
                onUpdateToolSettings={handleUpdateToolSettings}
                lang={lang}
                prompts={prompts}
                onUsePrompt={handleUsePrompt}
                onUpdatePrompt={updatePrompt}
                onDeletePrompt={deletePrompt}
                onOpenPromptWizard={() => setShowPromptWizardModal(true)}
                onExportPrompts={handleExportPrompts}
                onImportPrompts={handleImportPrompts}
            />
        </div>
        <input
            type="file"
            ref={importFileRef}
            onChange={onFileImportChange}
            accept=".zip"
            className="hidden"
        />
        <input
            type="file"
            ref={promptImportFileRef}
            onChange={onPromptFileImportChange}
            accept=".zip"
            className="hidden"
        />

        {showSettingsModal && <SettingsModal settings={session.settings} onClose={() => setShowSettingsModal(false)} onSave={(newSettings) => setSession(produce(draft => { draft.settings = newSettings; }))} lang={lang} />}
        {showStudioConfigModal && <StudioConfigModal 
            onClose={() => setShowStudioConfigModal(false)}
            onSave={handleUpdateActiveTools}
            activeTools={session.activeTools || []}
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
            sourcesCount={session.sources.length}
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
            setSession(produce(draft => {
                const source = draft.sources.find(s => s.id === id);
                if (source) source.name = name;
            }));
            setSourceToRename(null);
        }} lang={lang} />}
        {showAgentConfigModal && <AgentConfigModal 
            initialSelectedAgents={session.agentConfig} 
            onClose={() => setShowAgentConfigModal(false)} 
            onSave={(newConfig) => setSession(produce(draft => { draft.agentConfig = newConfig; }))} 
            lang={lang}
            profileId={session.profileId}
        />}
        {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} onSave={(key) => { sessionStorage.setItem('geminiApiKey', key); setGeminiApiKey(key); setShowApiKeyModal(false); }} lang={lang} />}
        {showNewSessionModal && <NewSessionModal 
            onClose={() => setShowNewSessionModal(false)} 
            onConfirm={(name, profileId) => {
                setShowNewSessionModal(false);
                startNewSession(name, profileId, true);
            }} 
            lang={lang}
            canContinue={!isRecording && (session.messages.length > 0 || session.sources.length > 0 || session.hasAudio)}
            onContinue={() => {
                setShowNewSessionModal(false);
                handleContinueRecording();
            }}
        />}
        {showPromptWizardModal && geminiApiKey && <PromptWizardModal
            apiKey={geminiApiKey}
            lang={lang}
            onClose={() => setShowPromptWizardModal(false)}
            onUsePrompt={handleUsePrompt}
            onSavePrompt={handleOpenSavePromptModal}
        />}
        {showSavePromptModal && promptToSave && <SavePromptModal
            promptText={promptToSave}
            prompts={prompts}
            onClose={() => {
                setShowSavePromptModal(false);
                setPromptToSave(null);
            }}
            onSave={handleSavePrompt}
            lang={lang}
        />}
    </div>
  );
};

export default App;