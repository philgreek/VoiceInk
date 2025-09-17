
export interface Message {
  id: string;
  text: string;
  timestamp: number;
  sender: 'user' | 'interlocutor';
}

export interface SpeakerProfile {
  initial: string;
  bubbleColor: string;
  avatarColor: string;
}

export interface Settings {
  user: SpeakerProfile;
  interlocutor: SpeakerProfile;
  theme: 'dark' | 'light' | 'neutral';
  language: string;
}

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