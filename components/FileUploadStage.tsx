

import React from 'react';
import { ReconciliationFile, ReconciliationFileType } from '../types';
import { UI_TEXT_RECONCILIATION as UI_TEXT, ACCEPTED_BANK_STATEMENT_TYPES, ACCEPTED_INTERNAL_RECORD_TYPES, MAX_FILES_PER_UPLOAD_SLOT } from '../constants';
import { FileUpload } from './FileUpload';
import { ReconciliationFileItem } from './ReconciliationFileItem'; // New component
import { Alert, AlertType } from './Alert';

interface FileUploadStageProps {
  bankStatementFiles: ReconciliationFile[];
  internalLedgerFiles: ReconciliationFile[];
  onAddFiles: (files: File[], type: ReconciliationFileType) => void;
  onRemoveFile: (fileId: string, type: ReconciliationFileType) => void;
  onProcessAllFiles: () => void;
  onViewExtractedData: (file: ReconciliationFile) => void;
  canProceedToReconciliation: boolean;
  onProceedToReconciliation: () => void;
  // onNavigateToHistory?: () => void; // For future history view
}

export const FileUploadStage: React.FC<FileUploadStageProps> = ({
  bankStatementFiles,
  internalLedgerFiles,
  onAddFiles,
  onRemoveFile,
  onProcessAllFiles,
  onViewExtractedData,
  canProceedToReconciliation,
  onProceedToReconciliation,
  // onNavigateToHistory,
}) => {
  const pendingBankFilesCount = bankStatementFiles.filter(f => f.status === 'pending').length;
  const pendingInternalFilesCount = internalLedgerFiles.filter(f => f.status === 'pending').length;
  const totalPendingFiles = pendingBankFilesCount + pendingInternalFilesCount;
  
  const successfullyProcessedBankCount = bankStatementFiles.filter(f => f.status === 'success').length;
  const successfullyProcessedInternalCount = internalLedgerFiles.filter(f => f.status === 'success').length;
  const hasAnySuccessfulFiles = successfullyProcessedBankCount > 0 || successfullyProcessedInternalCount > 0;
  const hasFilesToProcess = bankStatementFiles.length > 0 || internalLedgerFiles.length > 0;


  const primaryButtonClasses = "w-full sm:w-auto text-white font-semibold py-3 px-6 rounded-lg shadow-lg bg-gradient-to-br from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const proceedButtonText = UI_TEXT.proceedToReconciliationButton;
  const processButtonText = UI_TEXT.processFilesButton;

  const formatInfoColumns = UI_TEXT.internalRecordsFormatInfoColumns;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-sky-700 mb-6 text-center"> {/* Adjusted mb for alert */}
        {UI_TEXT.fileUploadTitle}
      </h2>

      <div className="mb-6 sm:mb-8"> {/* Wrapper for the Alert with bottom margin */}
        <Alert
          message={UI_TEXT.internalRecordsFormatInfoTitle}
          type={AlertType.Info}
        >
          <p className="text-xs mb-1.5">
            {UI_TEXT.internalRecordsFormatInfoIntro}
          </p>
          <ul className="list-none space-y-1 text-xs">
            {formatInfoColumns.map((item, index) => (
              <li key={index} className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 mt-0.5 text-sky-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-slate-500"> {item.example}</span>
                  <span className={`italic ml-1 ${item.importance.includes("CRUCIAL") ? 'text-rose-600 font-medium' : 'text-slate-400'}`}> - {item.importance}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-2 font-medium">
            {UI_TEXT.internalRecordsFormatInfoOutro}
          </p>
        </Alert>
      </div>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8">
        {/* Bank Statements Section */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-lg sm:text-xl font-semibold text-sky-600 mb-4 border-b border-slate-300 pb-2">
            {UI_TEXT.bankStatementsSectionTitle}
          </h3>
          <FileUpload
            onFilesSelect={(files) => onAddFiles(files, ReconciliationFileType.BankStatement)}
            acceptedFileTypes={ACCEPTED_BANK_STATEMENT_TYPES}
            maxFiles={MAX_FILES_PER_UPLOAD_SLOT}
            uploadButtonText="Adicionar Extrato(s)"
            uploadInstructionsText={UI_TEXT.uploadInstructionsBank}
            idSuffix="bank"
          />
          {bankStatementFiles.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
              {bankStatementFiles.map(file => (
                <ReconciliationFileItem
                  key={file.id}
                  file={file}
                  onRemove={() => onRemoveFile(file.id, ReconciliationFileType.BankStatement)}
                  onViewData={file.status === 'success' || file.status === 'error' ? () => onViewExtractedData(file) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Internal Records Section */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-lg shadow-md border border-slate-200">
          <h3 className="text-lg sm:text-xl font-semibold text-teal-600 mb-4 border-b border-slate-300 pb-2"> {/* Adjusted mb to 4 */}
            {UI_TEXT.internalRecordsSectionTitle}
          </h3>
          {/* Alert moved from here */}
          {/* Removed div className="mt-4" */}
          <FileUpload
            onFilesSelect={(files) => onAddFiles(files, ReconciliationFileType.InternalLedger)}
            acceptedFileTypes={ACCEPTED_INTERNAL_RECORD_TYPES}
            maxFiles={MAX_FILES_PER_UPLOAD_SLOT}
            uploadButtonText="Adicionar Registro(s) Interno(s)"
            uploadInstructionsText={UI_TEXT.uploadInstructionsInternal}
            idSuffix="internal"
          />
          {internalLedgerFiles.length > 0 && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
              {internalLedgerFiles.map(file => (
                <ReconciliationFileItem
                  key={file.id}
                  file={file}
                  onRemove={() => onRemoveFile(file.id, ReconciliationFileType.InternalLedger)}
                  onViewData={file.status === 'success' || file.status === 'error' ? () => onViewExtractedData(file) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {(bankStatementFiles.length === 0 && internalLedgerFiles.length === 0) && (
         <p className="text-center text-slate-500 py-4 mb-6">{UI_TEXT.noFilesUploaded}</p>
      )}

      <div className="mt-8 pt-8 border-t border-slate-300 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onProcessAllFiles}
          disabled={!hasFilesToProcess || totalPendingFiles === 0}
          className={primaryButtonClasses}
        >
          {processButtonText} {totalPendingFiles > 0 ? `(${totalPendingFiles} pendente(s))` : ''}
        </button>
        
        {hasAnySuccessfulFiles && totalPendingFiles === 0 && ( // Show proceed button if files processed and no pending
             <button
                onClick={onProceedToReconciliation}
                disabled={!canProceedToReconciliation}
                className={`${primaryButtonClasses} bg-teal-600 hover:bg-teal-700 focus:ring-teal-500`}
            >
                {proceedButtonText}
            </button>
        )}
      </div>
    </div>
  );
};
