import { useState, useCallback, useEffect } from 'react';
import { Session, Message, Settings } from '../types';
// FIX: Updated import to use the renamed `initDB` function from `utils/db`.
import { initDB } from '../utils/db';

const MAX_HISTORY_ITEMS = 10;

export const useSessionHistory = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      // FIX: Call renamed function `initDB`.
      const db = await initDB();
      // Get all sessions, sort by savedAt descending, and limit to MAX_HISTORY_ITEMS
      const allSessions = await db.getAll('sessions');
      const sortedSessions = allSessions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setSessions(sortedSessions.slice(0, MAX_HISTORY_ITEMS));
    } catch (error) {
      console.error("Failed to load session history from IndexedDB", error);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const saveSession = useCallback(async (
    sessionData: { name: string; messages: Message[]; settings: Settings, hasAudio: boolean },
    audioBlob: Blob | null
  ) => {
    // FIX: Call renamed function `initDB`.
    const db = await initDB();
    const newSession: Session = {
      ...sessionData,
      id: `session-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    
    await db.put('sessions', newSession);
    if(audioBlob && newSession.hasAudio) {
        await db.put('audio', { id: newSession.id, blob: audioBlob });
    }

    // After saving, re-fetch to update the list and apply the limit
    await fetchSessions();
    
    // Prune old entries if history exceeds the limit
    const allSessions = await db.getAll('sessions');
    if (allSessions.length > MAX_HISTORY_ITEMS) {
        const sorted = allSessions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        const sessionsToDelete = sorted.slice(MAX_HISTORY_ITEMS);
        const tx = db.transaction(['sessions', 'audio'], 'readwrite');
        const sessionStore = tx.objectStore('sessions');
        const audioStore = tx.objectStore('audio');
        await Promise.all(sessionsToDelete.map(s => {
            sessionStore.delete(s.id);
            audioStore.delete(s.id);
        }));
        await tx.done;
    }

  }, [fetchSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    // FIX: Call renamed function `initDB`.
    const db = await initDB();
    const tx = db.transaction(['sessions', 'audio'], 'readwrite');
    await tx.objectStore('sessions').delete(sessionId);
    await tx.objectStore('audio').delete(sessionId);
    await tx.done;
    await fetchSessions(); // Re-fetch to update UI
  }, [fetchSessions]);
  
  const getSessionAudio = useCallback(async (sessionId: string): Promise<Blob | null> => {
      try {
        // FIX: Call renamed function `initDB`.
        const db = await initDB();
        const audioRecord = await db.get('audio', sessionId);
        return audioRecord ? audioRecord.blob : null;
      } catch (error) {
        console.error("Failed to get session audio from IndexedDB", error);
        return null;
      }
  }, []);

  return { sessions, saveSession, deleteSession, getSessionAudio };
};
