
import React, { useRef } from 'react';
import { UI_TEXT_RECONCILIATION as UI_TEXT } from '../constants'; // Use new UI text
import { Alert, AlertType } from './Alert';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
  acceptedFileTypes: string; // e.g., ".pdf,.csv"
  maxFiles?: number;
  uploadButtonText?: string;
  uploadInstructionsText?: string;
  idSuffix: string; // To make input IDs unique if multiple instances are used
}

const DEFAULT_MAX_FILES = 5;

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelect,
  disabled,
  acceptedFileTypes,
  maxFiles = DEFAULT_MAX_FILES,
  uploadButtonText,
  uploadInstructionsText,
  idSuffix
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = event.target.files;
    if (files) {
      if (files.length > maxFiles) {
        setUploadError((UI_TEXT.maxFilesError as (max: number) => string)(maxFiles));
        event.target.value = ''; // Clear selection
        return;
      }
      const fileArray = Array.from(files);
      onFilesSelect(fileArray);
      event.target.value = ''; // Clear selection after processing
    }
  };

  const triggerFileInput = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const buttonClasses = "w-full flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg shadow-md bg-gradient-to-br from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";

  return (
    <div>
      {uploadError && <Alert message={uploadError} type={AlertType.Error} onDismiss={() => setUploadError(null)} />}
      <input
        id={`file-upload-input-${idSuffix}`}
        name={`file-upload-input-${idSuffix}`}
        type="file"
        className="sr-only"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFileTypes}
        disabled={disabled}
        multiple
      />
      <button
        type="button"
        onClick={triggerFileInput}
        disabled={disabled}
        className={buttonClasses}
        aria-label={uploadButtonText || UI_TEXT.addFileButton as string}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {uploadButtonText || UI_TEXT.addFileButton as string}
      </button>
      {uploadInstructionsText && <p className="text-xs text-center text-slate-500 mt-2">{uploadInstructionsText}</p>}
    </div>
  );
};
