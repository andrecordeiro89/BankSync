// Core Financial Transaction Types
export interface BankTransaction {
  id: string; // Unique ID for this transaction instance
  date: string | null; // DD/MM/AAAA
  description: string;
  amount: number | null; // Positive for credit, negative for debit
  type: 'credit' | 'debit' | 'unknown';
  reference?: string | null; // Bank-specific reference
  balanceAfter?: number | null; // Optional balance after transaction
  sourceDocumentId: string; // Link back to the ReconciliationFile
  rawText?: string; // Optional: raw text snippet from where it was extracted
  isMatched?: boolean; // Flag if this transaction is part of a match
}

export interface LedgerEntry {
  id: string; // Unique ID for this ledger entry instance
  date: string | null; // DD/MM/AAAA
  description: string;
  amount: number | null; // Expected amount, typically positive
  reference?: string | null; // Internal reference (e.g., invoice number, journal ID)
  accountCode?: string | null; // Chart of accounts code
  costCenter?: string | null; // Cost center if applicable
  sourceDocumentId: string; // Link back to the ReconciliationFile
  rawText?: string; // Optional: raw text snippet
  isMatched?: boolean; // Flag if this entry is part of a match
}

// Combined type for extracted data from a single file
export interface ExtractedFinancialData {
  bankTransactions?: BankTransaction[];
  ledgerEntries?: LedgerEntry[];
  parseErrors?: string[]; // Errors during parsing/extraction for this file
}

// Represents an uploaded file (either bank statement or internal record)
export enum ReconciliationFileType {
  BankStatement = "BankStatement",
  InternalLedger = "InternalLedger",
}

export interface ReconciliationFile {
  id: string;
  fileName: string;
  file: File;
  fileType: ReconciliationFileType; // To distinguish between bank statement and internal ledger
  status: 'pending' | 'processing' | 'success' | 'error';
  extractedData: ExtractedFinancialData | null;
  errorMessage?: string | null;
  imagePreviewUrl?: string; // For PDF first page or image-based statements
  processedTimestamp?: string;
}

export enum MatchStatus {
  MatchedExact = 'matched_exact',
  MatchedWithDiscrepancy = 'matched_discrepancy',
  MatchedManual = 'matched_manual', // For future manual matching
  PendingReview = 'pending_review', // For AI suggestions
  Investigate = 'investigate'
}

export interface MatchDiscrepancy {
  amount?: { bank: number; ledger: number; difference: number };
  date?: { bank: string | null; ledger: string | null; differenceDaysAbs: number };
  reference?: boolean; // true if references differ but other things match
  description?: boolean; // true if descriptions differ significantly
}

export interface MatchedPair {
  id: string; // Unique ID for this match instance
  bankTransaction: BankTransaction;
  ledgerEntry: LedgerEntry;
  matchConfidence: 'high' | 'medium' | 'low' | 'manual';
  discrepancy: MatchDiscrepancy | null; // Null if it's a perfect match based on initial rules
  status: MatchStatus;
  notes?: string;
}

export interface ReconciliationSummary {
  totalBankTransactions: number;
  totalLedgerEntries: number;
  
  totalBankAmount: number;
  totalLedgerAmount: number;

  matchedPairsCount: number;
  totalAmountMatched: number; // Sum of amounts from one side (e.g., bank side) of matched pairs (exact matches)
  
  discrepanciesCount: number;
  totalAmountBankInDiscrepancies: number;
  totalAmountLedgerInDiscrepancies: number;
  netDifferenceInDiscrepancies: number;

  unmatchedBankItemsCount: number;
  totalUnmatchedBankValue: number;
  
  unmatchedLedgerItemsCount: number;
  totalUnmatchedLedgerValue: number;
}


// Holds the overall result of a reconciliation session
export interface ReconciliationSessionData {
  sessionId: string;
  sessionDate: string;
  bankStatementFiles: ReconciliationFile[];
  internalLedgerFiles: ReconciliationFile[];
  
  allBankTransactions: BankTransaction[]; // All unique transactions after processing
  allLedgerEntries: LedgerEntry[];       // All unique entries after processing

  matchedPairs: MatchedPair[];
  // Unmatched items will be derived by filtering allBankTransactions/allLedgerEntries in the UI for display
  // or can be pre-calculated and stored if performance becomes an issue.
  // For now, let's derive them.

  summary: ReconciliationSummary;
  generationTimestamp: string;
  isFinalized?: boolean;
}

// Application States for Bank Reconciliation
export enum AppState {
  FILE_UPLOAD,             // Screen for uploading bank statements and internal records
  PROCESSING_FILES,        // AI is processing the uploaded files
  VIEWING_RECONCILIATION,  // Main screen to view and interact with reconciliation results
  VIEW_SESSION_HISTORY,    // Screen to view past reconciliation sessions
}

// For UI text consistency
export interface InternalRecordsFormatInfoColumn {
  label: string;
  example: string;
  importance: string;
}

export interface UIText {
  appName: string;
  // File Upload Stage
  fileUploadTitle: string;
  bankStatementsSectionTitle: string;
  internalRecordsSectionTitle: string;
  uploadInstructionsBank: string;
  uploadInstructionsInternal: string;
  addFileButton: string;
  maxFilesError: (max: number) => string;
  processFilesButton: string;
  processingFilesMessage: string;
  noFilesUploaded: string;
  removeFileButton: string;
  fileStatusPending: string;
  fileStatusProcessing: string;
  fileStatusSuccess: string;
  fileStatusError: string;
  proceedToReconciliationButton: string;
  allFilesProcessedOrError: string;
  viewExtractedDataButton: string;

  // Internal Records Format Info
  internalRecordsFormatInfoTitle: string;
  internalRecordsFormatInfoIntro: string;
  internalRecordsFormatInfoColumns: InternalRecordsFormatInfoColumn[];
  internalRecordsFormatInfoOutro: string;

  // Reconciliation View Stage
  reconciliationWorkspaceTitle: string;
  reconciliationSummaryTitle: string;
  bankTransactionsTitle: string;
  ledgerEntriesTitle: string;
  matchedItemsTitle: string;
  discrepanciesTitle: string;
  unmatchedBankTitle: string;
  unmatchedLedgerTitle: string;
  
  reconcileButton: string;
  markAsInvestigateButton: string;
  editTransactionButton: string;
  saveChangesButton: string;
  cancelButton: string;
  confirmButton: string;
  noTransactionsExtracted: string;
  errorExtractingTransactions: string;
  matchConfidenceLabel: string;
  highConfidence: string;
  mediumConfidence: string;
  lowConfidence: string;
  manualMatch: string;
  
  amountMismatchAlert: (bankAmt: string, ledgerAmt: string, diff: string) => string;
  dateMismatchAlert: (bankDate: string, ledgerDate: string, diffDays: number) => string;
  referenceMismatchAlert: string;
  descriptionMismatchAlert: string;
  exactMatchInfo: string;
  discrepancyInfo: string;

  downloadReportButton: string;
  reportDownloadInProgress: string;
  reportDownloadSuccess: string;
  reportDownloadNotReady: string;

  // Summary Labels
  summaryTotalBankItems: string;
  summaryTotalLedgerItems: string;
  summaryTotalBankAmount: string;
  summaryTotalLedgerAmount: string;
  summaryMatchedPairsCount: string;
  summaryTotalAmountMatched: string;
  summaryDiscrepanciesCount: string;
  summaryNetDifferenceInDiscrepancies: string;
  summaryUnmatchedBankCount: string;
  summaryUnmatchedBankValue: string;
  summaryUnmatchedLedgerCount: string;
  summaryUnmatchedLedgerValue: string;

  // History
  reconciliationHistoryTitle: string;
  noSessionsInHistory: string;
  viewSessionButton: string;
  backToFileUploadButton: string;
  sessionIdLabel: string;
  sessionDateLabel: string;
  totalMatchedLabel: string;

  // General
  pageTitleSuffix: string;
  errorGeneral: string;
  successGeneral: string;
  aiSuggestionsTooltip: string;
  loadingMessage: string;
  performingInitialMatchingMessage: string;

  // Modal Titles
  modalTitleViewExtractedData: (fileName: string) => string;
  modalTitleEditTransaction: string;
  modalTitleConfirmAction: string;
}


// Helper type for items that might be corrected by the user (e.g. transaction details)
export interface CorrectedTransactionItem {
  originalId: string; // ID of the BankTransaction or LedgerEntry
  originalDescription: string;
  correctedDescription: string;
  originalAmount: number | null;
  correctedAmount: number | null;
}

export enum ItemType {
  BankTransaction = "BankTransaction",
  LedgerEntry = "LedgerEntry",
}