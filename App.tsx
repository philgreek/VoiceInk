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
import { AgentConfigModal } from './components/AgentConfigModal';
import { produce } from 'immer';
import { t, Language } from './utils/translations';
import { useHistoryState } from './hooks/useHistoryState';
import { useSessionHistory } from './hooks/useSessionHistory';
import { usePrompts } from './hooks/usePrompts';
import { AudioPlayer } from './components/AudioPlayer';
import introJs from 'intro.js';
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
import { VideoFeed } from './components/VideoFeed';

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
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [rawTranscriptionText, setRawTranscriptionText] = useState('');
  const [isDiarizing, setIsDiarizing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [loadedAudio, setLoadedAudio] = useState<Blob | null>(null);

  // Modal and Panel visibility state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [mainInputText, setMainInputText] = useState('');
  const [promptToSave, setPromptToSave] = useState<string | null>(null);

  
  // AI and Data state
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
  const lang = session?.settings.language as Language || 'ru';
  
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
    if (session) {
      debouncedSave(session, loadedAudio);
    }
  }, [session, loadedAudio, debouncedSave]);


  // Transcription hook setup
  const onFinalTranscript = useCallback((transcript: string) => {
    setRawTranscriptionText(prev => (prev ? prev.trim() + ' ' : '') + transcript.trim());
  }, []);

  const handleDiarizeConversation = async () => {
    if (!rawTranscriptionText.trim()) return;

    setIsDiarizing(true);
    const textToProcess = rawTranscriptionText;
    setRawTranscriptionText(''); 

    try {
        const response = await fetch('/api/diarize-transcription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToProcess, lang })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Diarization failed');
        }

        const diarizedResult: { sender: 'user' | 'interlocutor', text: string }[] = await response.json();
        
        setSession(produce(draft => {
            if (!draft) return;

            const newMessages: Message[] = diarizedResult.map(m => ({
                id: `msg-${Date.now()}-${Math.random()}`,
                text: m.text,
                timestamp: 0, // Simplified timestamp for now
                sender: m.sender
            }));

            draft.messages.push(...newMessages);
            
            let transcriptionSource = draft.sources.find(s => s.type === 'transcription');
            if (!transcriptionSource) {
                transcriptionSource = { id: `source-transcription-${draft.id}`, name: t('sourceTypeTranscription', lang), type: 'transcription', content: [] };
                draft.sources.push(transcriptionSource);
            }
            transcriptionSource.content = draft.messages.filter(m => m.timestamp !== -1);
        }));

    } catch (error) {
        console.error("Error during diarization:", error);
        alert(t('aiError', lang));
        setRawTranscriptionText(textToProcess);
    } finally {
        setIsDiarizing(false);
    }
};

  const onRecordingComplete = useCallback((audioBlob: Blob | null) => {
    setLoadedAudio(audioBlob);
    setSession(produce(draft => {
      if (!draft) return;
      draft.hasAudio = !!audioBlob;
    }));
  }, [setSession]);

  const { isListening, interimTranscript, startListening, stopListening, isSpeechRecognitionSupported, pauseListening, resumeListening } = useTranscription({
      lang,
      onFinalTranscript,
      onRecordingComplete,
      mediaStream
  });
  
  useEffect(() => {
    if (session?.settings) {
        localStorage.setItem('voiceInkSettings', JSON.stringify(session.settings));
        document.body.className = `theme-${session.settings.theme}`;
    }
  }, [session?.settings]);
  
  const startNewSession = (name: string, profileId: SessionProfileId, startRecording = false) => {
        setSession(currentSession => {
            const newSession = getInitialSession();
            newSession.name = name;
            newSession.profileId = profileId;
            newSession.settings = currentSession?.settings || getDefaultSettings();
            newSession.activeTools = profiles[profileId].tools;
            
            resetSession(newSession);
            setLoadedAudio(null);
            setPlaybackTime(0);
            setMainInputText('');
            setRawTranscriptionText('');
            setActiveDiscussionTopic(null);

            if (startRecording) {
                handleContinueRecording();
            }
            return newSession;
        });
    };
    
    const handleContinueRecording = async () => {
        if (!isSpeechRecognitionSupported) {
            alert("Speech Recognition is not supported in your browser.");
            return;
        }
        setIsRecording(true);
        setIsPaused(false);
        setRawTranscriptionText('');
        
        setSession(produce(draft => {
            if (!draft) return;
            if (!draft.sources.some(s => s.type === 'transcription')) {
                 const newSource: Source = { id: `source-transcription-${draft.id}`, name: 'Live Transcription', type: 'transcription', content: [] };
                 draft.sources.push(newSource);
                 if (!draft.selectedSourceIds?.includes(newSource.id)) {
                     draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
                 }
            }
        }));
    };
    
    useEffect(() => {
        let isMounted = true;
    
        const setupStream = async () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
    
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoEnabled });
                if (isMounted) {
                    setMediaStream(stream);
                }
            } catch (err) {
                console.error("Error getting media stream:", err);
                alert("Could not access microphone/camera.");
                if (isMounted) {
                    setIsRecording(false);
                    setIsVideoEnabled(false);
                }
            }
        };
    
        if (isRecording) {
            setupStream();
        } else {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
            }
        }
    
        return () => {
            isMounted = false;
        };
    }, [isRecording, isVideoEnabled]);

    useEffect(() => {
        if (isRecording && mediaStream) {
            startListening();
        } else {
            stopListening();
        }
    }, [isRecording, mediaStream, startListening, stopListening]);
    
    const handleStop = () => {
        setIsRecording(false);
        setIsPaused(false);
        handleDiarizeConversation();
    };
    
    const handleToggleVideo = () => {
        setIsVideoEnabled(p => !p);
    };

    const handleLoadSession = async (sessionToLoad: Session) => {
        const audioBlob = await getSessionAudio(sessionToLoad.id);
        
        setSession(currentSession => {
            const defaultSession = getInitialSession();
            const currentSettings = currentSession?.settings || defaultSession.settings;

            const mergedSession = { 
                ...defaultSession, 
                ...sessionToLoad,
                settings: sessionToLoad.settings ? { ...sessionToLoad.settings, theme: currentSettings.theme, language: currentSettings.language } : currentSettings
            };

            resetSession(mergedSession);
            setLoadedAudio(audioBlob);
            setShowHistoryDropdown(false);
            setMainInputText('');
            setRawTranscriptionText('');
            setActiveDiscussionTopic(null);
            return mergedSession;
        });
    };

    const handleExportSession = async (sessionId: string) => {
        const sessionToExport = sessionId === session?.id ? session : sessions.find(s => s.id === sessionId);

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
            const response = await fetch('api/process-source', {
                method: 'POST',
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
                if (!draft) return;
                draft.sources.push(newSource);
                draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
            }));
        } catch (error) {
            console.error('Error processing source:', error);
            alert(t('sourceProcessingError', lang));
        } finally {
            setIsProcessingSource(false);
        }
    }, [lang, setSession]);
    
    const handleToggleSourceSelection = (sourceId: string) => {
        setSession(produce(draft => {
            if (!draft) return;
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
            if (!draft) return;
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
            if (!draft) return;
            draft.sources = draft.sources.filter(s => s.id !== sourceId);
            if (draft.selectedSourceIds) {
                draft.selectedSourceIds = draft.selectedSourceIds.filter(id => id !== sourceId);
            }
        }));
    };

    const buildAIContext = useCallback((): string => {
        if (!session) return '';
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
    }, [session]);
    
    const handleSplitMessage = () => {
        if (!selectionContext) return;
        const { messageId, text: selectedText } = selectionContext;

        setSession(produce(draft => {
            if (!draft) return;
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
            if (!draft) return;
            const msg = draft.messages.find(m => m.id === selectionContext.messageId);
            if (msg) msg.sender = newSpeaker;
        }));
        setSelectionContext(null);
    };

    const handleDeleteMessageOnSelection = () => {
        if (!selectionContext) return;
        setSession(produce(draft => {
            if (!draft) return;
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
        const userMessage: Message = {
            id: `msg-user-${Date.now()}`,
            text: prompt,
            timestamp: -1,
            sender: 'user',
        };
    
        const assistantPlaceholder: Message = {
            id: `msg-assistant-${Date.now()}`,
            text: '...',
            timestamp: -1,
            sender: 'assistant',
        };
    
        if (!session) return;
        const aiChatHistory = session.messages
            .filter(m => m.timestamp === -1 && m.text !== '...')
            .map((m): AIChatMessage | null => {
                if (m.sender === 'user') {
                    return { role: 'user', parts: [{ text: m.text }] };
                }
                if (m.sender === 'assistant' && typeof m.answer === 'string' && m.answer) {
                    return { role: 'model', parts: [{ text: m.answer }] };
                }
                return null;
            })
            .filter((m): m is AIChatMessage => m !== null);
    
        const chatHistoryWithPrompt: AIChatMessage[] = [...aiChatHistory, { role: 'user', parts: [{ text: prompt }] }];
        
        setSession(produce(draft => {
            if (!draft) return;
            draft.messages.push(userMessage);
            draft.messages.push(assistantPlaceholder);
        }));
    
        setIsProcessingAgent(true);
        setMainInputText('');
    
        try {
            const context = buildAIContext();
            
            const response = await fetch('api/agent-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context, chatHistoryWithPrompt, lang })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const { answer, citations: rawCitations } = await response.json();
    
            setSession(produce(draft => {
                if (!draft) return;
                const processedCitations: Citation[] = rawCitations.map((rawCit: any, index: number) => {
                    const source = draft.sources.find(s => s.name === rawCit.sourceName);
                    return {
                        index: index + 1,
                        sourceName: rawCit.sourceName,
                        fragment: rawCit.fragment,
                        sourceId: source ? source.id : null,
                    };
                });
    
                const msgToUpdate = draft.messages.find(m => m.id === assistantPlaceholder.id);
                if (msgToUpdate) {
                    msgToUpdate.text = '';
                    msgToUpdate.answer = answer;
                    msgToUpdate.citations = processedCitations;
                }
            }));
    
        } catch (e) {
            console.error("Error asking AI Agent:", e);
            alert(t('aiError', lang));
            setSession(produce(draft => {
                if (!draft) return;
                draft.messages = draft.messages.filter(m => m.id !== userMessage.id && m.id !== assistantPlaceholder.id);
            }));
        } finally {
            setIsProcessingAgent(false);
        }
    };
    
    const handleSaveToNote = useCallback((title: string, content: string, type: string) => {
        setSession(produce(draft => {
            if (!draft) return;
            const newNote: Note = {
                id: `note-${Date.now()}`,
                title,
                content,
                type,
                time: new Date().toISOString(),
            };
            if (!draft.notes) draft.notes = [];
            draft.notes.push(newNote);
        }));
    }, [setSession]);

    const handleTriggerTool = useCallback(async (toolId: StudioToolId) => {
        const context = buildAIContext();
        if (!context.trim()) {
            alert("Please select at least one source for analysis.");
            return;
        }

        const noteType = toolId;
        let noteTitleKey: Parameters<typeof t>[0] = 'note';
        switch(toolId) {
            case 'emotionAnalysis': noteTitleKey = 'toolEmotionAnalysis'; break;
            case 'tonalityAnalysis': noteTitleKey = 'toolTonalityAnalysis'; break;
            case 'textStyle': noteTitleKey = 'toolTextStyle'; break;
            case 'brainstorm': noteTitleKey = 'toolBrainstorm'; break;
            case 'grammarCheck': noteTitleKey = 'toolGrammarCheck'; break;
        }

        setProcessingTool(toolId);
        try {
            const response = await fetch('api/studio-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toolId,
                    context,
                    lang,
                    settings: toolId === 'textStyle' ? session?.toolSettings?.textStyle : undefined
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const { result } = await response.json();
            handleSaveToNote(t(noteTitleKey, lang), result, noteType);
        } catch (e) {
            console.error(`Error triggering tool ${toolId}:`, e);
            alert(t('aiError', lang));
        } finally {
            setProcessingTool(null);
        }
    }, [lang, buildAIContext, session?.toolSettings, handleSaveToNote, setSession]);

    const handleGenerateSourceGuide = async (sourceId: string) => {
        if (!session) return;
        const source = session.sources.find(s => s.id === sourceId);
        if (!source || source.guide) return;
    
        setIsProcessingGuide(true);
        try {
          const content = Array.isArray(source.content)
            ? source.content.map(m => m.text).join('\n')
            : source.content;
          
          const response = await fetch('api/source-guide', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content, lang })
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Server error');
          }
          
          const guide = await response.json();
          
          setSession(produce(draft => {
            if (!draft) return;
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
        setSession(produce(draft => {
            if (!draft) return;
            const note = draft.notes?.find(n => n.id === noteId);
            if (!note) return;
            const newSource: Source = {
                id: `source-${Date.now()}`,
                name: note.title,
                type: 'file',
                content: note.content,
                isSelected: true,
            };
            draft.sources.push(newSource);
            draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
        }));
    };

    const handleConvertAllNotesToSource = () => {
        setSession(produce(draft => {
            if (!draft || !draft.notes || draft.notes.length === 0) return;
            const combinedContent = draft.notes.map(note => `--- Note: ${note.title} ---\n${note.content}`).join('\n\n');
            const newSourceName = `${t('allNotes', lang)} - ${new Date().toLocaleDateString()}`;
            const newSource: Source = {
                id: `source-${Date.now()}`,
                name: newSourceName,
                type: 'file',
                content: combinedContent,
                isSelected: true,
            };
            draft.sources.push(newSource);
            draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
        }));
    };

    const handleDeleteNote = (noteId: string) => {
        setSession(produce(draft => {
            if (draft?.notes) {
                draft.notes = draft.notes.filter(n => n.id !== noteId);
            }
        }));
    };

    const handleRenameNote = (noteId: string, newTitle: string) => {
        setSession(produce(draft => {
            const note = draft?.notes?.find(n => n.id === noteId);
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
          if (!draft) return;
          if (!draft.notes) draft.notes = [];
          draft.notes.push(newNote);
          newNoteId = newNote.id;
        }));
        return newNoteId;
    };
    
    const handleUpdateNoteContent = (noteId: string, newContent: string) => {
        setSession(produce(draft => {
          const note = draft?.notes?.find(n => n.id === noteId);
          if (note) note.content = newContent;
        }));
    };

    const handleUpdateActiveTools = (newTools: StudioToolId[]) => {
        setSession(produce(draft => {
            if(draft) draft.activeTools = newTools;
        }));
    };

    const handleUpdateToolSettings = (toolId: StudioToolId, settings: any) => {
        setSession(produce(draft => {
            if(!draft) return;
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
            if(draft) draft.name = newName;
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
            if(!draft) return;
            draft.messages.push(thinkingMessage);
            draft.messages.push(assistantPlaceholder);
        }));

        try {
            const response = await fetch('api/start-discussion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, context, lang })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const rawText = await response.text();
            
            setSession(produce(draft => {
                if(!draft) return;
                const citations: Citation[] = [];
                const citationRegex = /\{\{cite: "([^"]+)"\}\}/g;
                
                const findSourceForFragment = (fragment: string) => {
                     const selectedSources = draft.sources.filter(s => draft.selectedSourceIds?.includes(s.id));
                     for (const source of selectedSources) {
                         const content = Array.isArray(source.content) ? source.content.map(m=>m.text).join('\n') : source.content;
                         if(content.includes(fragment)) {
                             return source;
                         }
                     }
                     return null;
                }

                let htmlContent = rawText.replace(citationRegex, (match, fragment) => {
                    const source = findSourceForFragment(fragment);
                    if (source) {
                        const citation: Citation = { index: citations.length + 1, sourceId: source.id, sourceName: source.name, fragment };
                        citations.push(citation);
                        return `{{CITATION:${citations.length - 1}}}`;
                    }
                    return '';
                });

                htmlContent = htmlContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />');

                const msgToUpdate = draft.messages.find(m => m.id === assistantPlaceholder.id);
                if (msgToUpdate) {
                    msgToUpdate.answer = htmlContent;
                    msgToUpdate.citations = citations;
                }
            }));

        } catch (error: any) {
            const errorMessage = error?.status === 429
                ? t('rateLimitError', lang)
                : t('aiError', lang);
            
            setSession(produce(draft => { 
                if (!draft) return;
                const msgToUpdate = draft.messages.find(m => m.id === assistantPlaceholder.id);
                if (msgToUpdate) {
                    msgToUpdate.text = `**Error:** ${errorMessage}`;
                }
            }));
        } finally {
            setIsProcessingDiscussion(false);
        }
    }, [buildAIContext, lang, setSession]);
    
    const handleCitationClick = (citation: Citation) => {
        if (!citation.sourceId) return;
        setSession(produce(draft => {
            if(draft) draft.highlightFragment = { sourceId: citation.sourceId!, fragment: citation.fragment };
        }));
        if (isSourcesPanelCollapsed) {
            setIsSourcesPanelCollapsed(false);
        }
    };
    
    const handleToggleInsightMode = async () => {
        if (!session) return;
        const currentlyActive = session.isInsightModeActive;

        if (currentlyActive) {
            setSession(produce(draft => {
                if(!draft) return;
                draft.isInsightModeActive = false;
                if(draft.insights) draft.insights = [];
            }));
            return;
        }

        setIsProcessingInsights(true);
        try {
            const sourceContext = buildAIContext();
            const chatContext = session.messages.map(m => m.text).join('\n\n') || '';
            const fullText = `${sourceContext}\n\n${chatContext}`;

            if (!fullText.trim()) {
                setIsProcessingInsights(false);
                return;
            }

            const response = await fetch('api/get-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: fullText, lang })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const insights = await response.json();

            setSession(produce(draft => {
                if (!draft) return;
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

    const handleAskAboutEntity = (entityName: string, sourceName: string) => {
        const prompt = t('tellMeAbout', lang, { entityName: `"${entityName}"` }) + ' ' + t('inTheContextOfSource', lang, { sourceName: `"${sourceName}"` });
        handleAskAIAgent(prompt);
    };

    if (session === null || typeof session === 'undefined') {
        return (
            <div className="bg-slate-950 text-slate-200 h-screen w-screen flex items-center justify-center">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 border-4 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Initializing session...</span>
                </div>
            </div>
        );
    }

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
                onClearHighlight={() => setSession(produce(draft => { if(draft) draft.highlightFragment = null; }))}
                lang={lang}
                isProcessingDiscussion={isProcessingDiscussion}
                onAskAboutEntity={handleAskAboutEntity}
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
                rawTranscriptionText={rawTranscriptionText}
                isDiarizing={isDiarizing}
                isProcessingFile={isProcessingSource}
                editingMessageId={editingMessageId}
                onUpdateMessage={(id, text) => {
                    setSession(produce(draft => {
                        if (!draft) return;
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
               {isVideoEnabled && mediaStream?.getVideoTracks().length > 0 && (
                    <VideoFeed stream={mediaStream} onClose={handleToggleVideo} />
                )}
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
                                isVideoEnabled={isVideoEnabled}
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
                                onToggleVideo={handleToggleVideo}
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

        {showSettingsModal && <SettingsModal settings={session.settings} onClose={() => setShowSettingsModal(false)} onSave={(newSettings) => setSession(produce(draft => { if(draft) draft.settings = newSettings; }))} lang={lang} />}
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
                if (!draft) return;
                const source = draft.sources.find(s => s.id === id);
                if (source) source.name = name;
            }));
            setSourceToRename(null);
        }} lang={lang} />}
        {showAgentConfigModal && <AgentConfigModal 
            initialSelectedAgents={session.agentConfig} 
            onClose={() => setShowAgentConfigModal(false)} 
            onSave={(newConfig) => setSession(produce(draft => { if(draft) draft.agentConfig = newConfig; }))} 
            lang={lang}
            profileId={session.profileId}
        />}
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
        {showPromptWizardModal && <PromptWizardModal
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