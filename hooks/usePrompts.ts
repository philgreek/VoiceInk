
import { useState, useCallback, useEffect } from 'react';
import { Prompt } from '../types';
import { initDB } from '../utils/db';

export const usePrompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  const fetchPrompts = useCallback(async () => {
    try {
      const db = await initDB();
      const allPrompts = await db.getAll('prompts');
      const sortedPrompts = allPrompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPrompts(sortedPrompts);
    } catch (error) {
      console.error("Failed to load prompts from IndexedDB", error);
      setPrompts([]);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const addPrompt = useCallback(async (prompt: Prompt) => {
    const db = await initDB();
    await db.put('prompts', prompt);
    await fetchPrompts();
  }, [fetchPrompts]);

  const updatePrompt = useCallback(async (prompt: Prompt) => {
    const db = await initDB();
    await db.put('prompts', prompt);
    await fetchPrompts();
  }, [fetchPrompts]);

  const deletePrompt = useCallback(async (promptId: string) => {
    const db = await initDB();
    await db.delete('prompts', promptId);
    await fetchPrompts();
  }, [fetchPrompts]);

  const importPrompts = useCallback(async (importedPrompts: Prompt[]) => {
    try {
      const db = await initDB();
      const tx = db.transaction('prompts', 'readwrite');
      await Promise.all(importedPrompts.map(prompt => tx.store.put(prompt)));
      await tx.done;
      await fetchPrompts();
    } catch (error) {
      console.error("Failed to import prompts into IndexedDB", error);
      throw error;
    }
  }, [fetchPrompts]);

  return { prompts, addPrompt, updatePrompt, deletePrompt, importPrompts };
};