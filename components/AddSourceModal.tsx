
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { XIcon, FileUploadIcon, LinkIcon } from './icons';
import { t, Language } from '../utils/translations';

interface AddSourceModalProps {
  onClose: () => void;
  onAdd: (file: File | null, url: string) => void;
  lang: Language;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({ onClose, onAdd, lang }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'audio/*': [],
      'text/plain': ['.txt'],
    },
  });

  const handleSubmit = () => {
    if (activeTab === 'upload' && file) {
      onAdd(file, '');
    } else if (activeTab === 'url' && url) {
      onAdd(null, url);
    }
  };

  const tabButtonClasses = (tabName: 'upload' | 'url') =>
    `flex-1 py-2 px-4 text-sm font-semibold rounded-md transition-colors focus:outline-none ${
      activeTab === tabName
        ? 'bg-[var(--accent-primary)] text-white'
        : 'bg-[var(--bg-element)] text-[var(--text-secondary)] hover:bg-[var(--bg-element-hover)]'
    }`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border-color)] w-full max-w-lg p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('addSourceTitle', lang)}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label={t('close', lang)}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-[var(--bg-element)] p-1 rounded-lg flex mb-4">
          <button onClick={() => setActiveTab('upload')} className={tabButtonClasses('upload')}>{t('uploadFile', lang)}</button>
          <button onClick={() => setActiveTab('url')} className={tabButtonClasses('url')}>{t('fromURL', lang)}</button>
        </div>

        {activeTab === 'upload' ? (
          <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-[var(--accent-primary)] bg-[var(--bg-element)]' : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <input {...getInputProps()} />
            <FileUploadIcon className="w-10 h-10 mx-auto text-[var(--text-secondary)] mb-2" />
            {file ? (
                <p className="text-[var(--text-primary)] font-semibold">{file.name}</p>
            ) : (
                <p className="text-[var(--text-secondary)]">{t('dropFileHere', lang)}</p>
            )}
            <p className="text-xs text-[var(--text-placeholder)] mt-1">{t('supportedFileTypes', lang)}</p>
          </div>
        ) : (
          <div>
            <label htmlFor="url-input" className="sr-only">{t('enterURL', lang)}</label>
            <div className="relative">
                 <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-placeholder)]" />
                 <input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('enterURL', lang)}
                    className="w-full bg-[var(--bg-element)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md py-3 pl-10 pr-3 focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 bg-[var(--bg-element)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-element-hover)]">
            {t('cancel', lang)}
          </button>
          <button
            onClick={handleSubmit}
            disabled={(activeTab === 'upload' && !file) || (activeTab === 'url' && !url)}
            className="px-6 py-2 bg-[var(--accent-primary)] text-white font-semibold rounded-md hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
          >
            {t('add', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
