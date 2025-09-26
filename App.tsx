


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscription } from './hooks/useTranscription';
// FIX: Added 'ActionItem' to the import list to resolve the "Cannot find name 'ActionItem'" error.
import { Message, Session, Settings, LoadedSession, SelectionContext, AnalysisResult, TextStyle, AIAgentExpertise, AIAgentDomain, AIChatMessage, Entity, InsightsSectionState, Source, SourceType, ActionItem } from './types';
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
import { MainAIChatInput } from './components/MainAIChatInput';
import { TextEditorToolbar } from './components/TextEditorToolbar';
import { ViewSourceModal } from './components/ViewSourceModal';
import { RenameSourceModal } from './components/RenameSourceModal';

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
    sources: [],
    settings: getDefaultSettings(),
    savedAt: new Date().toISOString(),
    hasAudio: false,
    analysisResult: null,
    selectedSourceIds: [],
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
  const [showSessionNameModal, setShowSessionNameModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showNotebookLMInstructions, setShowNotebookLMInstructions] = useState(false);
  const [showSourcesPanel, setShowSourcesPanel] = useState(true);
  const [showInsightsPanel, setShowInsightsPanel] = useState(true);
  const [isInsightsPanelExpanded, setIsInsightsPanelExpanded] = useState(false);
  const [showAgentConfigModal, setShowAgentConfigModal] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [sourceToView, setSourceToView] = useState<Source | null>(null);
  const [sourceToRename, setSourceToRename] = useState<Source | null>(null);

  // UI interaction state
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  
  // AI and Data state
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => sessionStorage.getItem('geminiApiKey'));
  const [isProcessing, setIsProcessing] = useState({ summary: false, actionItems: false, topics: false, proofread: false, agent: false, entities: false });
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [exportedFileName, setExportedFileName] = useState('session.txt');
  const [selectedAIAgents, setSelectedAIAgents] = useState<{ expertise: AIAgentExpertise[], domains: AIAgentDomain[] }>({ expertise: [], domains: [] });
  const [insightsSectionState, setInsightsSectionState] = useState<InsightsSectionState>({ summary: true, actionItems: true, keyTopics: true, textAnalysis: true, textEditor: true, aiChat: true });
  const [activeInsightsSection, setActiveInsightsSection] = useState<keyof AnalysisResult | null>(null);
  
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const { sessions, saveSession, deleteSession, getSessionAudio, updateSession } = useSessionHistory();
  const lang = settings.language as Language;
  
  const transcriptionSource = sessionState.sources.find(s => s.type === 'transcription');
  const messages = (transcriptionSource?.content as Message[]) || [];

  // Transcription hook setup
  const onFinalTranscript = useCallback((transcript: string) => {
      const newSpeaker = isPushToTalkActive ? 'user' : currentSpeaker;
      const newMessage: Message = {
          id: `msg-${Date.now()}`,
          text: transcript,
          timestamp: audioRef.current?.currentTime ?? 0,
          sender: newSpeaker,
          isClone: false,
      };
      setHistoryState(currentMessages => [...currentMessages, newMessage]);
  }, [currentSpeaker, isPushToTalkActive, setHistoryState]);

  const onRecordingComplete = useCallback((audioBlob: Blob | null) => {
    setLoadedAudio(audioBlob);
    setSessionState(produce(draft => {
      const transcription = draft.sources.find(s => s.type === 'transcription');
      if(transcription) transcription.name = draft.name;
      draft.hasAudio = !!audioBlob;
    }));
    setShowSessionNameModal(true);
  }, []);

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

  useEffect(() => {
      if (transcriptionSource) {
          const newContent = historyState;
          setSessionState(produce(draft => {
              const source = draft.sources.find(s => s.type === 'transcription');
              if (source) source.content = newContent;
          }));
      }
  }, [historyState, transcriptionSource]);
  
  const startNewSession = (startRecording = false) => {
        const newSession = getInitialSession();
        newSession.settings = settings;
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
            if (!transcriptionSource) {
                 setSessionState(produce(draft => {
                     const newSource: Source = { id: `source-${Date.now()}`, name: 'Live Transcription', type: 'transcription', content: [], isSelected: true };
                     draft.sources.push(newSource);
                     draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
                     resetHistory([]);
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

    const handleSaveSession = async (name: string) => {
        const finalSession = produce(sessionState, draft => {
            draft.name = name;
        });
        await saveSession(finalSession, loadedAudio);
        setShowSessionNameModal(false);
    };

    const handleLoadSession = async (session: Session) => {
        const audioBlob = await getSessionAudio(session.id);
        const transcription = session.sources.find(s => s.type === 'transcription');
        setSessionState(session);
        resetHistory(transcription?.content as Message[] || []);
        setLoadedAudio(audioBlob);
        setShowHistoryModal(false);
    };

    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();
            if (selectedText && !editingMessage) {
                const range = selection?.getRangeAt(0);
                const container = range?.commonAncestorContainer;
                const messageElement = (container?.nodeType === Node.ELEMENT_NODE ? (container as Element) : container?.parentElement)?.closest('[data-message-id]');
                const messageId = messageElement?.getAttribute('data-message-id');
                // FIX: Added a check to ensure that the contextual action bar (for splitting messages)
                // only appears for user or interlocutor messages, not for AI assistant messages,
                // which resolves a downstream type error.
                if (messageId) {
                    const message = messages.find(m => m.id === messageId);
                    if (message && message.sender !== 'assistant') {
                        setSelectionContext({ messageId, text: selectedText });
                    }
                } else {
                    setSelectionContext(null);
                }
            } else {
                setSelectionContext(null);
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [editingMessage, messages]);

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
            
            const isTranscription = sourceType === 'audio';
            const newSource: Source = {
                id: `source-${Date.now()}`,
                name: sourceName,
                type: isTranscription ? 'transcription' : sourceType as SourceType,
                content: data.content,
                isSelected: true
            };
            
            setSessionState(produce(draft => {
                if(isTranscription) {
                    // Replace existing transcription if one exists
                    const existingIndex = draft.sources.findIndex(s => s.type === 'transcription');
                    if (existingIndex !== -1) {
                         draft.sources[existingIndex] = newSource;
                    } else {
                         draft.sources.push(newSource);
                    }
                    resetHistory(data.content);
                } else {
                    draft.sources.push(newSource);
                }
                draft.selectedSourceIds = [...(draft.selectedSourceIds || []), newSource.id];
            }));
            
        } catch (error) {
            console.error('Error processing source:', error);
            alert(t('sourceProcessingError', lang));
        } finally {
            setIsProcessingSource(false);
        }
    }, [geminiApiKey, lang]);
    
    const handleToggleSourceSelection = (sourceId: string, isSelectAll = false, selectAllState = false) => {
        setSessionState(produce(draft => {
            if (isSelectAll) {
                 draft.selectedSourceIds = selectAllState ? draft.sources.map(s => s.id) : [];
            } else {
                const currentSelected = draft.selectedSourceIds || [];
                if (currentSelected.includes(sourceId)) {
                    draft.selectedSourceIds = currentSelected.filter(id => id !== sourceId);
                } else {
                    draft.selectedSourceIds = [...currentSelected, sourceId];
                }
            }
        }));
    };

    const buildAIContext = useCallback((): string => {
        const selectedSources = sessionState.sources.filter(s => sessionState.selectedSourceIds?.includes(s.id));
        return selectedSources.map(source => {
            let contentString = '';
            if (source.type === 'transcription' && Array.isArray(source.content)) {
                contentString = source.content.map(msg => `${settings[msg.sender as 'user' | 'interlocutor'].initial}: ${msg.text}`).join('\n');
            } else {
                contentString = source.content as string;
            }
            return `--- Source: ${source.name} (${source.type}) ---\n${contentString}`;
        }).join('\n\n');
    }, [sessionState.sources, sessionState.selectedSourceIds, settings]);

    const addAiMessageToChat = (generatedBy: keyof AnalysisResult, text: string) => {
        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            text,
            timestamp: 0,
            sender: 'assistant',
            generatedBy,
        };
        setHistoryState(current => [...current, newMessage]);
    };
    
    const handleAnalysis = useCallback(async (
        type: 'summary' | 'actionItems' | 'keyTopics' | 'entities',
        apiCall: (apiKey: string, context: string, lang: Language) => Promise<any>
    ) => {
        if (!geminiApiKey) { setShowApiKeyModal(true); return; }
        
        const context = buildAIContext();
        if (!context.trim()) return;

        setIsProcessing(produce(draft => { (draft as any)[type] = true; }));
        try {
            const result = await apiCall(geminiApiKey, context, lang);
            setSessionState(produce(draft => {
                if (!draft.analysisResult) draft.analysisResult = { summary: '', actionItems: [], keyTopics: [] };
                (draft.analysisResult as any)[type] = result;
            }));

            if(type === 'summary') addAiMessageToChat('summary', result);
            if(type === 'actionItems') addAiMessageToChat('actionItems', result.map((item: ActionItem) => `- ${item.task}`).join('\n'));
            if(type === 'keyTopics') addAiMessageToChat('keyTopics', result.join(', '));
            
        } catch (e) {
            alert(t('aiError', lang));
        } finally {
            setIsProcessing(produce(draft => { (draft as any)[type] = false; }));
        }
    }, [geminiApiKey, lang, buildAIContext]);

    const handleGenerateSummary = () => handleAnalysis('summary', getSummary);
    const handleExtractActionItems = () => handleAnalysis('actionItems', getActionItems);
    const handleExtractKeyTopics = () => handleAnalysis('keyTopics', getKeyTopics);
    const handleExtractEntities = () => handleAnalysis('entities', extractEntities);
    
    const handleAskAIAgent = async (prompt: string) => {
        if (!geminiApiKey) { setShowApiKeyModal(true); return; }
        
        const currentChatHistory = sessionState.analysisResult?.aiChatHistory || [];
        const newHistory: AIChatMessage[] = [...currentChatHistory, { role: 'user', parts: [{ text: prompt }] }];
        
        setSessionState(produce(draft => {
            if (!draft.analysisResult) draft.analysisResult = { summary: '', actionItems: [], keyTopics: [] };
            draft.analysisResult.aiChatHistory = newHistory;
        }));
        
        setIsProcessing(produce(draft => { draft.agent = true; }));
        try {
            const context = buildAIContext();
            const responseText = await getAgentResponse(geminiApiKey, context, selectedAIAgents, lang, newHistory);
            
            const newAiMessage: Message = {
                id: `msg-${Date.now()}`,
                text: responseText,
                timestamp: 0,
                sender: 'assistant',
                generatedBy: 'aiChatHistory',
            };

            setHistoryState(current => [...current, newAiMessage]);
            
            setSessionState(produce(draft => {
                if(draft.analysisResult) {
                     draft.analysisResult.aiChatHistory = [...newHistory, { role: 'model', parts: [{ text: responseText }] }];
                }
            }));
        } catch (e) {
            alert(t('aiError', lang));
            setSessionState(produce(draft => {
                if(draft.analysisResult) draft.analysisResult.aiChatHistory = currentChatHistory;
            }));
        } finally {
            setIsProcessing(produce(draft => { draft.agent = false; }));
        }
    };
    
    const handleClearAnalysis = () => {
        setSessionState(produce(draft => {
            draft.analysisResult = null;
        }));
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
    
    const handleClear = () => {
        if(window.confirm(t('clearChatConfirmation', lang))) {
            startNewSession(false);
        }
    };

    return (
    <div className={`theme-${settings.theme} bg-[var(--bg-main)] text-[var(--text-primary)] h-screen w-screen flex flex-col`}>
      <div className="flex flex-grow min-h-0">
        <SourcesPanel
          isOpen={showSourcesPanel}
          sources={sessionState.sources}
          selectedSourceIds={sessionState.selectedSourceIds || []}
          onAddSource={() => setShowAddSourceModal(true)}
          onRemoveSource={(sourceId) => {
              setSessionState(produce(draft => {
                  draft.sources = draft.sources.filter(s => s.id !== sourceId);
                  draft.selectedSourceIds = draft.selectedSourceIds?.filter(id => id !== sourceId);
              }));
          }}
          onToggleSelection={handleToggleSourceSelection}
          onRename={setSourceToRename}
          onView={setSourceToView}
          onSendToChat={(sourceId) => {
              const source = sessionState.sources.find(s => s.id === sourceId);
              if (source) {
                  const newSource: Source = produce(source, draft => {
                      draft.id = `source-${Date.now()}`;
                      draft.isClone = true;
                      draft.originId = source.id;
                  });
                  const newMessage: Message = {
                      id: `msg-${Date.now()}`,
                      text: typeof newSource.content === 'string' ? newSource.content : '',
                      timestamp: 0,
                      sender: 'user',
                      isClone: true,
                      relatedSourceIds: [newSource.id]
                  };
                  setSessionState(produce(draft => {
                      draft.sources.push(newSource);
                  }));
                  setHistoryState(current => [...current, newMessage]);
              }
          }}
          lang={lang}
        />
        <main className={`flex-grow flex flex-col min-w-0 relative z-20 bg-[var(--bg-main)] transition-all duration-300`}>
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
            onToggleSources={() => setShowSourcesPanel(p => !p)}
            lang={lang}
            isEditing={!!editingMessage}
          />
          {editingMessage && <TextEditorToolbar messageId={editingMessage.id} />}
          {sessionState.sources.length > 0 && <SessionBar sessionName={sessionState.name} />}
          <ChatWindow
            ref={chatWindowRef}
            messages={messages}
            interimTranscript={interimTranscript}
            currentSpeaker={currentSpeaker}
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessingFile={isProcessingSource}
            settings={settings}
            onUpdateMessage={(id, text) => {
                setHistoryState(produce(draft => {
                    const msg = draft.find(m => m.id === id);
                    if (msg) msg.text = text;
                }));
                setEditingMessage(null);
            }}
            onChangeSpeaker={(id) => {
                setHistoryState(produce(draft => {
                    const msg = draft.find(m => m.id === id);
                    if (msg) msg.sender = msg.sender === 'user' ? 'interlocutor' : 'user';
                }));
            }}
            onDeleteMessage={(id) => {
                 setHistoryState(produce(draft => {
                    const index = draft.findIndex(m => m.id === id);
                    if (index > 0) {
                        draft[index - 1].text += ' ' + draft[index].text;
                        draft.splice(index, 1);
                    } else if (index === 0 && draft.length > 1) {
                         draft.splice(index, 1);
                    }
                }));
            }}
            onStartEdit={(message) => {
                setEditingMessage(message);
                setSelectionContext(null);
            }}
            onConvertToSource={handleConvertToSource}
            onMessageClick={(message) => {
                if (message.generatedBy) {
                    setActiveInsightsSection(message.generatedBy);
                }
            }}
            lang={lang}
            playbackTime={playbackTime}
            onSeekAudio={(time) => { if(audioRef.current) audioRef.current.currentTime = time; }}
            entities={sessionState.analysisResult?.entities}
          />
          <AudioPlayer
            ref={audioRef}
            blob={loadedAudio}
            onTimeUpdate={setPlaybackTime}
            isVisible={sessionState.sources.some(s => (s.type === 'audio' || s.type === 'transcription') && sessionState.selectedSourceIds?.includes(s.id))}
          />
          <MainAIChatInput 
            onAskAIAgent={handleAskAIAgent}
            isProcessing={isProcessing.agent}
            lang={lang}
          />
          <TranscriptionControls
            isRecording={isRecording}
            isPaused={isPaused}
            isPushToTalkActive={isPushToTalkActive}
            isAIAssistantOpen={showInsightsPanel}
            onStartClick={() => {
                if (sessionState.sources.length > 0 && transcriptionSource) {
                    if (window.confirm(t('startNewSessionConfirmation', lang))) {
                        startNewSession(true);
                    }
                } else {
                    startNewSession(true);
                }
            }}
            onStopClick={handleStop}
            onPauseClick={() => {
                if (isPaused) restartListening();
                else restartListening();
                setIsPaused(!isPaused);
            }}
            onMicToggle={() => setIsPushToTalkActive(p => !p)}
            onAIToggle={() => setShowInsightsPanel(p => !p)}
            lang={lang}
          />
        </main>
        {/* FIX: Removed invalid props 'selectedStyle', 'onStyleChange', and several 'onExport...' props from InsightsPanel component call to align with its defined props interface. */}
        <InsightsPanel
            isOpen={showInsightsPanel}
            isExpanded={isInsightsPanelExpanded}
            onToggleExpand={() => setIsInsightsPanelExpanded(p => !p)}
            onClose={() => setShowInsightsPanel(false)}
            isSessionLoaded={sessionState.sources.length > 0}
            analysisResult={sessionState.analysisResult}
            isProcessing={isProcessing}
            lang={lang}
            selectedAIAgents={selectedAIAgents}
            onShowAgentConfig={() => setShowAgentConfigModal(true)}
            sectionState={insightsSectionState}
            onToggleSection={(section) => setInsightsSectionState(produce(draft => { draft[section] = !draft[section]; }))}
            onGenerateSummary={handleGenerateSummary}
            onExtractActionItems={handleExtractActionItems}
            onExtractTopics={handleExtractKeyTopics}
            onExtractEntities={handleExtractEntities}
            onClearAnalysis={handleClearAnalysis}
            onConvertToSource={handleConvertToSource}
            activeSection={activeInsightsSection}
        />
      </div>

      {/* All Modals */}
      {showAddSourceModal && <AddSourceModal onClose={() => setShowAddSourceModal(false)} onAdd={handleAddSource} lang={lang} />}
      {sourceToView && <ViewSourceModal source={sourceToView} onClose={() => setSourceToView(null)} lang={lang} />}
      {sourceToRename && <RenameSourceModal source={sourceToRename} onClose={() => setSourceToRename(null)} onSave={(id, name) => {
          setSessionState(produce(draft => {
              const source = draft.sources.find(s => s.id === id);
              if (source) source.name = name;
          }));
          setSourceToRename(null);
      }} lang={lang} />}
      {showAgentConfigModal && <AgentConfigModal initialSelectedAgents={selectedAIAgents} onClose={() => setShowAgentConfigModal(false)} onSave={setSelectedAIAgents} lang={lang} />}
      {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} onSave={(key) => { sessionStorage.setItem('geminiApiKey', key); setGeminiApiKey(key); setShowApiKeyModal(false); }} lang={lang} />}
      {showSessionNameModal && <SessionNameModal onClose={() => setShowSessionNameModal(false)} onConfirm={handleSaveSession} lang={lang} />}
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
       {selectionContext && (
        <ContextualActionBar
          context={selectionContext}
          onClear={() => setSelectionContext(null)}
          onSplit={(messageId, text, newSpeaker) => {
             setHistoryState(produce(draft => {
                const msgIndex = draft.findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    const originalMsg = draft[msgIndex];
                    const parts = originalMsg.text.split(text);
                    originalMsg.text = parts[0].trim();
                    
                    const newMsg1 = { id: `msg-${Date.now()}`, text, sender: newSpeaker, timestamp: originalMsg.timestamp };
                    const newMsg2 = { id: `msg-${Date.now()+1}`, text: parts[1].trim(), sender: originalMsg.sender as 'user' | 'interlocutor', timestamp: originalMsg.timestamp };
                    
                    const newMessages = [newMsg1];
                    if (newMsg2.text) newMessages.push(newMsg2);
                    
                    draft.splice(msgIndex + 1, 0, ...newMessages);
                }
             }));
             setSelectionContext(null);
          }}
          settings={settings}
          lang={lang}
        />
      )}
    </div>
  );
};

export default App;