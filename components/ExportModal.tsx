
import React from 'react';
import { DownloadIcon, ClipboardIcon, ShareIcon, XIcon } from './icons';
import { t, Language } from '../utils/translations';

interface ExportModalProps {
  onClose: () => void;
  onSaveAsTxt: () => void;
  onSaveAsPdf: () => void;
  onSaveAsDocx: () => void;
  onCopyToClipboard: () => void;
  onSendToApp: () => void;
  lang: Language;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  onClose,
  onSaveAsTxt,
  onSaveAsPdf,
  onSaveAsDocx,
  onCopyToClipboard,
  onSendToApp,
  lang,
}) => {
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-md p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('exportChat', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="border-b border-[var(--border-color)] pb-4">
             <div className="space-y-2">
                 <button
                    onClick={onSaveAsTxt}
                    className="w-full flex items-center gap-4 text-left p-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <DownloadIcon className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 ml-1" />
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] text-base">{t('saveAsTxt', lang)}</span>
                      <p className="text-sm text-[var(--text-secondary)]">{t('saveAsTxtDescription', lang)}</p>
                    </div>
                 </button>
                 <button
                    onClick={onSaveAsPdf}
                    className="w-full flex items-center gap-4 text-left p-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <DownloadIcon className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 ml-1" />
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] text-base">{t('saveAsPdf', lang)}</span>
                      <p className="text-sm text-[var(--text-secondary)]">{t('saveAsPdfDescription', lang)}</p>
                    </div>
                 </button>
                 <button
                    onClick={onSaveAsDocx}
                    className="w-full flex items-center gap-4 text-left p-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <DownloadIcon className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 ml-1" />
                    <div>
                      <span className="font-semibold text-[var(--text-primary)] text-base">{t('saveAsDocx', lang)}</span>
                      <p className="text-sm text-[var(--text-secondary)]">{t('saveAsDocxDescription', lang)}</p>
                    </div>
                 </button>
             </div>
          </div>
          <div className="pt-2 space-y-2">
            <button
              onClick={onCopyToClipboard}
              className="w-full flex items-center gap-4 text-left p-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              <ClipboardIcon className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 ml-1" />
              <div>
                <span className="font-semibold text-[var(--text-primary)] text-base">{t('copyToClipboard', lang)}</span>
                <p className="text-sm text-[var(--text-secondary)]">{t('copyToClipboardDescription', lang)}</p>
              </div>
            </button>
             <button
              onClick={onSendToApp}
              className="w-full flex items-center gap-4 text-left p-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              <ShareIcon className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 ml-1" />
              <div>
                <span className="font-semibold text-[var(--text-primary)] text-base">{t('sendToApp', lang)}</span>
                <p className="text-sm text-[var(--text-secondary)]">{t('sendToAppDescription', lang)}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};