
import { useState, useCallback, useEffect } from 'react';
import { Session, Source, Settings, AnalysisResult } from '../types';
import { initDB } from '../utils/db';
import { produce } from 'immer';

const MAX_HISTORY_ITEMS = 10;

export const useSessionHistory = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      const db = await initDB();
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
    sessionData: { name: string; sources: Source[]; settings: Settings, hasAudio: boolean, analysisResult: AnalysisResult | null, selectedSourceIds?: string[] },
    audioBlob: Blob | null
  ): Promise<Session> => {
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

    await fetchSessions();
    
    const allSessions = await db.getAll('sessions');
    if (allSessions.length > MAX_HISTORY_ITEMS) {
        const sorted = allSessions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        const sessionsToDelete = sorted.slice(MAX_HISTORY_ITEMS);
        const tx = db.transaction(['sessions', 'audio'], 'readwrite');
        const sessionStore = tx.objectStore('sessions');
        const audioStore = tx.objectStore('audio');
        await Promise.all(sessionsToDelete.map(s => {
            sessionStore.delete(s.id);
            if (s.hasAudio) {
                audioStore.delete(s.id);
            }
        }));
        await tx.done;
    }
    return newSession;
  }, [fetchSessions]);

  // FIX: Replaced 'updateSessionAnalysis' with a more generic 'updateSession' to handle partial updates.
  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>): Promise<Session> => {
    const db = await initDB();
    const session = await db.get('sessions', sessionId);
    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`);
    }
    const updatedSession = produce(session, draft => {
        Object.assign(draft, updates);
    });
    await db.put('sessions', updatedSession);
    
    setSessions(prevSessions => 
      produce(prevSessions, draft => {
        const index = draft.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          draft[index] = updatedSession;
        }
      })
    );
    return updatedSession;
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    const db = await initDB();
    const tx = db.transaction(['sessions', 'audio'], 'readwrite');
    await tx.objectStore('sessions').delete(sessionId);
    await tx.objectStore('audio').delete(sessionId);
    await tx.done;
    await fetchSessions();
  }, [fetchSessions]);
  
  const getSessionAudio = useCallback(async (sessionId: string): Promise<Blob | null> => {
      try {
        const db = await initDB();
        const audioRecord = await db.get('audio', sessionId);
        return audioRecord ? audioRecord.blob : null;
      } catch (error) {
        console.error("Failed to get session audio from IndexedDB", error);
        return null;
      }
  }, []);

  return { sessions, saveSession, deleteSession, getSessionAudio, updateSession };
};
