
import { useState, useCallback, useEffect } from 'react';
import { Session } from '../types';
import { initDB } from '../utils/db';
import JSZip from 'jszip';

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
    sessionData: Session,
    audioBlob: Blob | null
  ): Promise<Session> => {
    const db = await initDB();
    const sessionToSave: Session = {
      ...sessionData,
      savedAt: new Date().toISOString(),
      hasAudio: sessionData.hasAudio || !!audioBlob,
    };
    
    await db.put('sessions', sessionToSave);
    if(audioBlob) {
        await db.put('audio', { id: sessionToSave.id, blob: audioBlob });
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
    return sessionToSave;
  }, [fetchSessions]);

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

  const importSession = useCallback(async (file: File): Promise<Session> => {
    const zip = await JSZip.loadAsync(file);
    const sessionFile = zip.file('session.json');
    const audioFile = zip.file('audio.webm');

    if (!sessionFile) {
        throw new Error('session.json not found in the archive.');
    }
    
    const sessionDataString = await sessionFile.async('string');
    const importedData = JSON.parse(sessionDataString) as Session;
    
    const audioBlob = audioFile ? await audioFile.async('blob') : null;
    
    const sessionToSave: Session = {
        ...importedData,
        id: `session-${Date.now()}`, // Assign a new ID to prevent overwriting
        savedAt: new Date().toISOString(),
        hasAudio: !!audioBlob,
    };

    return saveSession(sessionToSave, audioBlob);
  }, [saveSession]);


  return { sessions, saveSession, deleteSession, getSessionAudio, importSession };
};