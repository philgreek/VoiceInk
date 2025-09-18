
import React from 'react';
import { XIcon, DownloadIcon, TrashIcon } from './icons';
import { t, Language } from '../utils/translations';
import { Session } from '../types';

interface HistoryModalProps {
  sessions: Session[];
  onClose: () => void;
  onLoad: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  lang: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  sessions,
  onClose,
  onLoad,
  onDelete,
  lang,
}) => {

  const handleDelete = (sessionId: string, sessionName: string) => {
    if (window.confirm(t('deleteSessionConfirmation', lang, { sessionName }))) {
      onDelete(sessionId);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-2xl p-6 sm:p-8 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('sessionHistory', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto max-h-[60vh] pr-2 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-placeholder)]">
              <p>{t('noSessionsFound', lang)}</p>
            </div>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="bg-[var(--bg-element)] p-3 rounded-lg flex justify-between items-center gap-4">
                <div className="truncate">
                  <p className="font-semibold text-[var(--text-primary)] truncate">{session.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{new Date(session.savedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onLoad(session)}
                    className="p-2 bg-[var(--bg-element-hover)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-md transition-colors"
                    title={t('loadSession', lang)}
                  >
                    <DownloadIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id, session.name)}
                    className="p-2 bg-[var(--bg-element-hover)] hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-500 rounded-md transition-colors"
                    title={t('deleteSession', lang)}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};