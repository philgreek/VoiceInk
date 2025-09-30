
import React, { useRef, useEffect } from 'react';
import { XIcon, DownloadIcon, TrashIcon, PlayIcon, FolderDownIcon, FileExportIcon, FileImportIcon } from './icons';
import { t, Language } from '../utils/translations';
import { Session } from '../types';

interface HistoryDropdownProps {
  sessions: Session[];
  onClose: () => void;
  onLoad: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onSaveAudio: (sessionId: string) => void;
  onExportSession: (sessionId: string) => void;
  onImportSession: () => void;
  lang: Language;
}

export const HistoryDropdown: React.FC<HistoryDropdownProps> = ({
  sessions,
  onClose,
  onLoad,
  onDelete,
  onSaveAudio,
  onExportSession,
  onImportSession,
  lang,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // This listener closes the dropdown if the user clicks anywhere outside of it.
      // By using 'click' instead of 'mousedown', we prevent a race condition where clicking the toggle button
      // would fire this 'outside click' event and its own 'click' event almost simultaneously,
      // causing the dropdown to flicker or not close as expected.
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  const handleDelete = (sessionId: string, sessionName: string) => {
    if (window.confirm(t('deleteSessionConfirmation', lang, { sessionName }))) {
      onDelete(sessionId);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-14 left-4 z-40 bg-[var(--bg-surface)] rounded-lg shadow-xl border border-[var(--border-color)] w-80 flex flex-col max-h-[calc(100vh-80px)]"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-3 border-b border-[var(--border-color)] flex-shrink-0">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('sessionHistory', lang)}</h2>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-2 space-y-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-placeholder)] text-sm">
            <p>{t('noSessionsFound', lang)}</p>
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="group bg-[var(--bg-element)] p-2 rounded-md flex justify-between items-center gap-2">
              <div 
                className="truncate flex items-center gap-3 cursor-pointer flex-grow"
                onClick={() => onLoad(session)}
              >
                 {session.hasAudio && <PlayIcon className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />}
                 <div className="truncate">
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)]">{session.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{new Date(session.savedAt).toLocaleString()}</p>
                 </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                    onClick={() => onExportSession(session.id)}
                    className="p-1.5 bg-[var(--bg-element-hover)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
                    title={t('exportSession', lang)}
                  >
                    <FileExportIcon className="w-4 h-4" />
                  </button>
                {session.hasAudio && (
                  <button
                    onClick={() => onSaveAudio(session.id)}
                    className="p-1.5 bg-[var(--bg-element-hover)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
                    title={t('saveAudioToFile', lang)}
                  >
                    <FolderDownIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(session.id, session.name)}
                  className="p-1.5 bg-[var(--bg-element-hover)] hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-500 rounded-md transition-colors"
                  title={t('deleteSession', lang)}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-2 border-t border-[var(--border-color)] flex-shrink-0">
          <button
              onClick={onImportSession}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors text-sm font-semibold text-slate-200"
          >
              <FileImportIcon className="w-4 h-4" />
              {t('importSession', lang)}
          </button>
      </div>
    </div>
  );
};