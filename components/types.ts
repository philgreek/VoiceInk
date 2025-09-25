
export interface Message {
  id: string;
  text: string;
  timestamp: number; // Seconds from the start of the recording
  sender: 'user' | 'interlocutor' | 'assistant';
}

export type SourceType = 'transcription' | 'audio' | 'file' | 'url';

export interface Source {
    id: string;
    name: string;
    type: SourceType;
    content: Message[] | string; // Message[] for transcription, string for others
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
  aiChatHistory?: AIChatMessage[];
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
  | 'speechwriter';

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
  | 'litigation';

export interface Session {
  id:string;
  name: string;
  sources: Source[];
  settings: Settings;
  savedAt: string;
  hasAudio: boolean;
  analysisResult: AnalysisResult | null;
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
