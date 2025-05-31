import React from 'react';
import { ReconciliationFile } from '../types';
import { UI_TEXT_RECONCILIATION as UI_TEXT } from '../constants';

interface ReconciliationFileItemProps {
  file: ReconciliationFile;
  onRemove: () => void;
  onViewData?: () => void; // Optional: to view extracted data
}

export const ReconciliationFileItem: React.FC<ReconciliationFileItemProps> = ({ file, onRemove, onViewData }) => {
  let statusColor = 'text-slate-500';
  let statusText = UI_TEXT.fileStatusPending as string;
  let statusDotColor = 'bg-slate-400'; // For the status dot

  switch (file.status) {
    case 'processing':
      statusColor = 'text-sky-600';
      statusText = UI_TEXT.fileStatusProcessing as string;
      statusDotColor = 'bg-sky-500 animate-pulse';
      break;
    case 'success':
      statusColor = 'text-emerald-600';
      statusText = UI_TEXT.fileStatusSuccess as string;
      statusDotColor = 'bg-emerald-500';
      break;
    case 'error':
      statusColor = 'text-rose-600';
      statusText = UI_TEXT.fileStatusError as string;
      statusDotColor = 'bg-rose-500';
      break;
    default: // pending
      statusColor = 'text-sky-700';
      statusDotColor = 'bg-sky-600';
      break;
  }

  const removeButtonClasses = "flex-shrink-0 p-1.5 rounded-full text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white shadow";
  const removeButtonErrorClass = `${removeButtonClasses} bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 focus:ring-rose-500`;
  const removeButtonNormalClass = `${removeButtonClasses} bg-gradient-to-br from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 focus:ring-slate-400`;
  
  const viewDataButtonClasses = "text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1.5 py-0.5";


  return (
    <div className="bg-white p-2.5 sm:p-3 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between space-x-3 hover:shadow-md transition-shadow duration-150">
      {file.imagePreviewUrl && (
        <img
          src={file.imagePreviewUrl}
          alt={`Preview ${file.fileName}`}
          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md flex-shrink-0 border border-slate-300 bg-slate-100"
        />
      )}
      {!file.imagePreviewUrl && (
         <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-slate-100 rounded-md border border-slate-300 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
         </div>
      )}

      <div className="flex-grow overflow-hidden">
        <p className="text-sm sm:text-base font-medium text-slate-700 truncate" title={file.fileName}>
          {file.fileName}
        </p>
        <div className="flex items-center">
            <span className={`w-2.5 h-2.5 rounded-full mr-1.5 ${statusDotColor}`}></span>
            <p className={`text-xs sm:text-sm font-medium ${statusColor}`}>{statusText}</p>
        </div>
        {file.status === 'error' && file.errorMessage && (
          <p className="text-xs text-rose-700 truncate mt-0.5" title={file.errorMessage}>
            Detalhe: {file.errorMessage}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end space-y-1.5 flex-shrink-0">
        {file.status !== 'processing' && (
          <button
            onClick={onRemove}
            className={file.status === 'error' ? removeButtonErrorClass : removeButtonNormalClass}
            aria-label={`Remover ${file.fileName}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 sm:w-4.5 sm:h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {file.status === 'processing' && (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className={`animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-sky-600`}></div>
          </div>
        )}
        {onViewData && (file.status === 'success' || (file.status === 'error' && file.extractedData)) && (
             <button onClick={onViewData} className={viewDataButtonClasses}>
                {UI_TEXT.viewExtractedDataButton as string}
             </button>
        )}
      </div>
    </div>
  );
};
