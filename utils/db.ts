

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Session, Prompt } from '../types';

const DB_NAME = 'VoiceInkDB';
const DB_VERSION = 2;

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
  prompts: {
    key: string;
    value: Prompt;
  };
}

let dbPromise: Promise<IDBPDatabase<VoiceInkDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VoiceInkDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('sessions')) {
                db.createObjectStore('sessions', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('audio')) {
                db.createObjectStore('audio', { keyPath: 'id' });
            }
        }
        if (oldVersion < 2) {
            if (!db.objectStoreNames.contains('prompts')) {
                db.createObjectStore('prompts', { keyPath: 'id' });
            }
        }
      },
    });
  }
  return dbPromise;
};