import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Session } from '../types';

const DB_NAME = 'VoiceInkDB';
const DB_VERSION = 1;

interface VoiceInkDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
  };
  audio: {
    key: string;
    value: {
      id: string;
      blob: Blob;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<VoiceInkDB>> | null = null;

// FIX: Renamed function to `initDB` to avoid name collision with imported `openDB`. This resolves errors related to merged declarations and incorrect type arguments.
export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VoiceInkDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};
