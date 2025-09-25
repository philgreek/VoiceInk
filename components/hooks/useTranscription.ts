
import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SpeechRecognition,
  SpeechRecognitionStatic,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '../types';
import { langToCode } from '../utils/translations';

const SpeechRecognitionAPI: SpeechRecognitionStatic | undefined =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const isSpeechRecognitionSupported = !!SpeechRecognitionAPI;

interface UseTranscriptionProps {
  lang: string;
  onFinalTranscript: (transcript: string) => void;
  onRecordingComplete: (audioBlob: Blob | null) => void;
  mediaStream: MediaStream | null;
}

export const useTranscription = ({ lang, onFinalTranscript, onRecordingComplete, mediaStream }: UseTranscriptionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const isListeningRef = useRef(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);
  
  useEffect(() => {
    onRecordingCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported || !SpeechRecognitionAPI) {
      console.error("Speech Recognition is not supported.");
      return;
    }
    
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    let lastProcessedFinal = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      setInterimTranscript(interim);
      
      const finalTrimmed = final.trim();
      if (finalTrimmed && finalTrimmed !== lastProcessedFinal) {
        lastProcessedFinal = finalTrimmed;
        onFinalTranscriptRef.current(finalTrimmed);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        lastProcessedFinal = '';
        try {
          recognition.start();
        } catch (e) {
          console.error("Error on automatic restart:", e);
          setIsListening(false);
          isListeningRef.current = false;
        }
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return;
      console.error('Speech recognition error:', event.error);
      isListeningRef.current = false;
      setIsListening(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = langToCode(lang);
    }
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current && mediaStream) {
      try {
        isListeningRef.current = true;
        setIsListening(true);
        setInterimTranscript('');
        recognitionRef.current.start();
        
        if (mediaStream.getAudioTracks().length > 0) {
            mediaRecorderRef.current = new MediaRecorder(mediaStream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.start();
        }
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        isListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, [mediaStream]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current.stop();
      
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.onstop = () => {
            const blob = audioChunksRef.current.length > 0
              ? new Blob(audioChunksRef.current, { type: 'audio/webm' })
              : null;
            onRecordingCompleteRef.current(blob);
            audioChunksRef.current = [];
        };
        mediaRecorderRef.current.stop();
      } else {
        onRecordingCompleteRef.current(null);
      }
    }
  }, []);
  
  const restartListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, interimTranscript, startListening, stopListening, isSpeechRecognitionSupported, restartListening };
};