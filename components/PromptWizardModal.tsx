

import React, { useState, useRef, useEffect } from 'react';
import { XIcon, SparklesIcon, SendIcon } from './icons';
import { t, Language } from '../utils/translations';
import { AIChatMessage } from '../types';
import { getPromptWizardResponse } from '../utils/gemini';

interface PromptWizardModalProps {
  lang: Language;
  onClose: () => void;
  onUsePrompt: (text: string) => void;
  onSavePrompt: (text: string) => void;
}

export const PromptWizardModal: React.FC<PromptWizardModalProps> = ({ lang, onClose, onUsePrompt, onSavePrompt }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIChatMessage = { role: 'user', parts: [{ text: input }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getPromptWizardResponse(newMessages, lang);
      const modelMessage: AIChatMessage = { role: 'model', parts: [{ text: responseText }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: AIChatMessage = { role: 'model', parts: [{ text: t('aiError', lang) }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClass = "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-2xl p-6 sm:p-8 flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-[var(--accent-primary)]" />
            <span>{t('promptWizardTitle', lang)}</span>
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><XIcon className="w-6 h-6" /></button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6 flex-shrink-0">{t('promptWizardDescription', lang)}</p>
        
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                {msg.role === 'model' && (
                    <div className="mt-3 pt-2 border-t border-slate-600 flex gap-2">
                        <button onClick={() => onUsePrompt(msg.parts[0].text)} className={`${buttonClass} bg-cyan-500 text-white hover:bg-cyan-600`}>{t('use', lang)}</button>
                        <button onClick={() => onSavePrompt(msg.parts[0].text)} className={`${buttonClass} bg-slate-600 text-slate-200 hover:bg-slate-500`}>{t('saveToLibrary', lang)}</button>
                    </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
                <div className="p-3 rounded-lg max-w-lg bg-slate-700 text-slate-200 rounded-bl-none flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
        
        <form onSubmit={handleSend} className="mt-6 flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('askPromptWizard', lang)}
            disabled={isLoading}
            className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md p-3 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors disabled:opacity-50">
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};