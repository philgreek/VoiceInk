
import { useState, useCallback } from 'react';
import { produce } from 'immer';

export const useHistoryState = <T>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((
      updater: T | ((currentState: T) => T),
      skipHistory: boolean = false
    ) => {
    setHistory(currentHistory => {
        const currentState = currentHistory[currentIndex];
        const newState = typeof updater === 'function' 
            ? (updater as (currentState: T) => T)(currentState)
            : updater;
        
        if (skipHistory) {
             const newHistory = [...currentHistory];
             newHistory[currentIndex] = newState;
             return newHistory;
        }

        // To prevent adding identical state to history
        if (Object.is(currentState, newState)) {
            return currentHistory;
        }

        const newHistory = currentHistory.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setCurrentIndex(newHistory.length - 1);
        return newHistory;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [canRedo]);
  
  const reset = useCallback((newState: T) => {
    setHistory([newState]);
    setCurrentIndex(0);
  }, []);

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
};