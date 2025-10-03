import React from 'react';
import { translations } from './utils/translations';

export interface Citation {
  index: number;
  sourceId: string | null;
  sourceName: string;
  fragment: string;
}

export interface Message {
  id: string;
  text: string; // For user messages, or placeholder for assistant
  timestamp: number; // Seconds from the start of the recording, or -1 for chat messages
  sender: 'user' | 'interlocutor' | 'assistant';
  answer?: string; // "The Sky" - The generated answer text with citation markers
  citations?: Citation[]; // "The Ground"
}

export type SourceType = 'transcription' | 'audio' | 'file' | 'url';

export interface KeyTopic {
  topic: string;
  theses: string[];
}

export interface KeyEntityGuide {
  name: string;
  type: 'Person' | 'Organization' | 'Term' | 'Place' | 'Date';
}

export interface SourceGuide {
  keyTopics: KeyTopic[];
  keyTakeaways: string[];
  keyPeople: KeyEntityGuide[];
}


export interface Source {
    id: string;
    name: string;
    type: SourceType;
    content: Message[] | string; // Message[] for transcription, string for others
    isSelected?: boolean;
    guide?: SourceGuide;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: string; // e.g., 'summary', 'flashcards'
  time: string; // ISO date string
}

export interface Prompt {
  id: string;
  name: string;
  text: string;
  category: string;
  createdAt: string; // ISO date string
}

export interface SpeakerProfile {
  initial: string;
  bubbleColor: string;
  avatarColor: string;
}

export interface Settings {
  user: SpeakerProfile;
  interlocutor: SpeakerProfile;
  assistant: SpeakerProfile;
  theme: 'dark' | 'light' | 'neutral';
  language: string;
}

export interface SelectionContext {
    messageId: string;
    text: string;
}

export interface ActionItem {
  task: string;
}

export type EntityType = 'PERSON' | 'ORGANIZATION' | 'DATE' | 'LOCATION' | 'MONEY' | 'OTHER';

export interface Entity {
  text: string;
  type: EntityType;
}

export interface AIChatMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

export interface AnalysisResult {
  summary: string;
  actionItems: ActionItem[];
  keyTopics: string[];
  styledText?: {
    style: TextStyle;
    text: string;
  };
  entities?: Entity[];
}

export type TextStyle = 
  | 'default' 
  | 'meeting' 
  | 'lecture' 
  | 'dialogue' 
  | 'interview' 
  | 'consultation' 
  | 'podcast' 
  | 'blog' 
  | 'business' 
  | 'literary' 
  | 'psychological' 
  | 'legal' 
  | 'scientific';

export type AIAgentExpertise = 
  | 'interviewer'
  | 'reporter'
  | 'recruiter'
  | 'sociologist'
  | 'screenwriter'
  | 'translator'
  | 'marketing_analyst'
  | 'tech_support'
  | 'business_analyst'
  | 'financial_advisor'
  | 'project_manager'
  | 'course_developer'
  | 'academic_researcher'
  | 'therapist'
  | 'legal_assistant'
  | 'detective'
  | 'chef_nutritionist'
  | 'customer_manager'
  | 'psychologist'
  | 'coach'
  | 'editor'
  | 'tutor'
  | 'speechwriter'
  | 'data_scientist'
  | 'ux_researcher'
  | 'software_developer'
  | 'product_manager'
  | 'strategist'
  | 'pr_specialist';

export type AIAgentDomain =
  | 'general'
  | 'technology'
  | 'finance'
  | 'healthcare'
  | 'law'
  | 'education'
  | 'art_culture'
  | 'science'
  | 'business_management'
  | 'human_resources'
  | 'marketing_sales'
  | 'customer_service'
  | 'psychology'
  | 'career_development'
  | 'cooking_nutrition'
  | 'journalism'
  | 'filmmaking'
  | 'constitutional_law'
  | 'litigation'
  | 'software_development'
  | 'data_science'
  | 'ux_ui_design'
  | 'product_management'
  | 'strategic_planning'
  | 'public_relations';

export interface AIAgentExpertiseItem {
  id: AIAgentExpertise;
  nameKey: keyof typeof translations.en;
  category: string;
  relatedDomains: AIAgentDomain[];
}

export interface AIAgentDomainItem {
  id: AIAgentDomain;
  nameKey: keyof typeof translations.en;
  category: string;
  relatedExpertise: AIAgentExpertise[];
}


export type SessionProfileId = 'pedagogical' | 'legal' | 'hr' | 'medical' | 'economic' | 'creative' | 'linguistic';

export type TextStyleId = 'scientific' | 'business' | 'publicistic' | 'artistic' | 'conversational';

export type StudioToolId = 'audioSummary' | 'videoSummary' | 'mindMap' | 'reports' | 'flashcards' | 'test' | 'caseBrief' | 'contractAnalysis' | 'interviewSummary' | 'candidateEval' | 'marketAnalysis' | 'financialReport' | 'scriptAnalysis' | 'brainstorm' | 'translation' | 'grammarCheck' | 'emotionAnalysis' | 'tonalityAnalysis' | 'textStyle';

export interface StudioTool {
  id: StudioToolId;
  nameKey: keyof typeof translations.en;
  descriptionKey: keyof typeof translations.en;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  category: string;
  isConfigurable?: boolean;
}

export interface SessionProfile {
    id: SessionProfileId;
    nameKey: keyof typeof translations.en;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    tools: StudioToolId[];
    recommendedExpertise: AIAgentExpertise[];
    recommendedDomains: AIAgentDomain[];
}

export interface ToolSettings {
    textStyle?: TextStyleId;
}

export interface AgentConfig {
    expertise: AIAgentExpertise[];
    domains: AIAgentDomain[];
}

export interface Insight {
  term: string;
  definition: string;
}

export interface Session {
  id:string;
  name: string;
  profileId: SessionProfileId;
  messages: Message[];
  sources: Source[];
  notes?: Note[];
  settings: Settings;
  savedAt: string;
  hasAudio: boolean;
  analysisResult: AnalysisResult | null;
  selectedSourceIds?: string[];
  activeTools?: StudioToolId[];
  toolSettings?: ToolSettings;
  agentConfig: AgentConfig;
  highlightFragment?: { sourceId: string; fragment: string } | null;
  insights?: Insight[];
  isInsightModeActive?: boolean;
}

export interface LoadedSession extends Session {
    audioBlob: Blob | null;
}

export type InsightsSectionState = {
  [key in 'summary' | 'actionItems' | 'keyTopics' | 'textAnalysis' | 'textEditor' | 'aiChat']: boolean;
};

// Web Speech API types for TypeScript
export interface SpeechRecognitionAlternative {
  transcript: string;
}
export interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
export interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
export interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
export interface SpeechRecognitionErrorEvent {
  error: string;
}
export interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;

  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
}
export interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}