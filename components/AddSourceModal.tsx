
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { XIcon, FileUploadIcon, LinkIcon, GoogleDriveIcon, YoutubeIcon, ClipboardIcon, SearchIcon } from './icons';
import { t, Language } from '../utils/translations';

interface AddSourceModalProps {
  onClose: () => void;
  onAdd: (file: File | null, url: string) => void;
  lang: Language;
  onSearchClick: () => void;
  sourcesCount: number;
}

const AddSourceOption: React.FC<{
    icon: React.ReactNode;
    title: string;
    onClick?: () => void;
    disabled?: boolean;
}> = ({ icon, title, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center gap-3 text-left p-3 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--bg-element)]"
    >
        <div className="flex-shrink-0">{icon}</div>
        <span className="font-semibold text-[var(--text-primary)] text-sm">{title}</span>
    </button>
);

export const AddSourceModal: React.FC<AddSourceModalProps> = ({ onClose, onAdd, lang, onSearchClick, sourcesCount }) => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      onAdd(acceptedFiles[0], '');
    }
  }, [onAdd]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
    },
  });
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-3xl p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('addSourceTitle', lang)}</h2>
           <div className="flex items-center gap-4">
              <button onClick={onSearchClick} className="flex items-center gap-2 text-sm font-semibold p-2 bg-[var(--bg-element)] hover:bg-[var(--bg-element-hover)] rounded-md transition-colors">
                  <SearchIcon className="w-4 h-4" />
                  {t('searchSources', lang)}
              </button>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label={t('close', lang)}>
                <XIcon className="w-6 h-6" />
              </button>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{t('addSourcesPrompt', lang)}</p>

        <div 
          {...getRootProps()}
          className={`relative p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-[var(--accent-primary)] bg-[var(--bg-element)]' : 'border-[var(--border-color)]'
          }`}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center">
                 <FileUploadIcon className="w-12 h-12 mx-auto text-[var(--accent-primary)] mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{t('uploadSources', lang)}</h3>
                <p>
                    <button onClick={open} className="text-[var(--accent-primary)] font-semibold hover:underline focus:outline-none">
                       {t('chooseOrDragFile', lang)}
                    </button>
                </p>
                 <p className="text-xs text-[var(--text-placeholder)] mt-2">{t('supportedFileTypesInfo', lang)}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="space-y-3">
                <h4 className="font-semibold text-sm text-[var(--text-secondary)]">{t('googleWorkspace', lang)}</h4>
                <AddSourceOption 
                    icon={<GoogleDriveIcon className="w-5 h-5" />}
                    title={t('googleDrive', lang)}
                    disabled // Placeholder
                />
            </div>
             <div className="space-y-3">
                <h4 className="font-semibold text-sm text-[var(--text-secondary)]">{t('addLink', lang)}</h4>
                <AddSourceOption 
                    icon={<LinkIcon className="w-5 h-5 text-green-400" />}
                    title={t('website', lang)}
                    disabled // Placeholder
                />
                <AddSourceOption 
                    icon={<YoutubeIcon className="w-5 h-5 text-red-500" />}
                    title={t('youtube', lang)}
                    disabled // Placeholder
                />
            </div>
             <div className="space-y-3">
                <h4 className="font-semibold text-sm text-[var(--text-secondary)]">{t('pasteText', lang)}</h4>
                 <AddSourceOption 
                    icon={<ClipboardIcon className="w-5 h-5 text-blue-400" />}
                    title={t('copiedText', lang)}
                    disabled // Placeholder
                />
            </div>
        </div>
        
        <div className="mt-8">
            <div className="flex justify-between items-center text-sm text-[var(--text-secondary)] mb-1">
                <span>{t('totalFiles', lang)}</span>
                <span>{sourcesCount} / 50</span>
            </div>
            <div className="w-full bg-[var(--bg-element)] rounded-full h-1.5">
                <div className="bg-[var(--accent-primary)] h-1.5 rounded-full" style={{width: `${(sourcesCount / 50) * 100}%`}}></div>
            </div>
        </div>

      </div>
    </div>
  );
};
