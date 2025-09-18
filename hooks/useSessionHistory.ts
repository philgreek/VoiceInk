
import { useState, useCallback, useEffect } from 'react';
import { Session, Message, Settings } from '../types';

const HISTORY_KEY = 'voiceInkSessionHistory';
const MAX_HISTORY_ITEMS = 10;

export const useSessionHistory = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setSessions(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load session history from localStorage", error);
      setSessions([]);
    }
  }, []);

  const updateAndPersistSessions = (newSessions: Session[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newSessions));
      setSessions(newSessions);
    } catch (error) {
      console.error("Failed to save session history to localStorage", error);
    }
  };

  const saveSession = useCallback((sessionData: { name: string; messages: Message[]; settings: Settings }) => {
    const newSession: Session = {
      ...sessionData,
      id: `session-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };

    setSessions(prevSessions => {
      const updatedSessions = [newSession, ...prevSessions];
      // Keep only the last MAX_HISTORY_ITEMS sessions
      if (updatedSessions.length > MAX_HISTORY_ITEMS) {
        updatedSessions.length = MAX_HISTORY_ITEMS;
      }
      updateAndPersistSessions(updatedSessions);
      return updatedSessions;
    });
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prevSessions => {
      const filteredSessions = prevSessions.filter(s => s.id !== sessionId);
      updateAndPersistSessions(filteredSessions);
      return filteredSessions;
    });
  }, []);

  return { sessions, saveSession, deleteSession };
};