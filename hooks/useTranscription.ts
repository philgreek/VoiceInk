

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
}

export const useTranscription = ({ lang = 'en-US' }: UseTranscriptionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isListeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const restartQueuedRef = useRef(false);

  useEffect(() => {
    if (!isSpeechRecognitionSupported || !SpeechRecognitionAPI) {
      console.error("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    
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
      if (final) {
        setFinalTranscript(final.trim());
      }
    };

    recognition.onend = () => {
      // If a restart was queued, execute it now that stopping is complete.
      if (restartQueuedRef.current) {
        restartQueuedRef.current = false;
        if (recognitionRef.current) {
          try {
            // The intention is to keep listening, so we don't change state, just start the API.
            recognitionRef.current.start();
          } catch (e) {
            console.error("Error on queued restart:", e);
            // If it fails, fully stop.
            isListeningRef.current = false;
            setIsListening(false);
          }
        }
        return;
      }

      if (manualStopRef.current) {
        manualStopRef.current = false;
        return;
      }

      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error("Error restarting speech recognition:", error);
              isListeningRef.current = false;
              setIsListening(false);
            }
          }
        }, 250);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        return;
      }
      console.error('Speech recognition error', event.error);
      const criticalErrors = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'aborted'];
      if (criticalErrors.includes(event.error)) {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };
    
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = langToCode(lang);
    }
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        manualStopRef.current = false;
        restartQueuedRef.current = false;
        setFinalTranscript('');
        setInterimTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
        isListeningRef.current = true;
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        isListeningRef.current = false;
        setIsListening(false);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      manualStopRef.current = true;
      restartQueuedRef.current = false;
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);
  
  const restartListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      restartQueuedRef.current = true;
      // stop() will trigger onend, which will then handle the start() call safely.
      recognitionRef.current.stop();
    }
  }, []);

  const resetFinalTranscript = useCallback(() => {
    setFinalTranscript('');
  }, []);

  return { isListening, finalTranscript, interimTranscript, startListening, stopListening, isSpeechRecognitionSupported, resetFinalTranscript, restartListening };
};