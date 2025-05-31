


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    AppState, 
    ReconciliationFile, 
    ExtractedFinancialData, 
    ReconciliationSessionData, 
    ReconciliationFileType,
    BankTransaction,
    LedgerEntry,
    MatchedPair,
    MatchDiscrepancy,
    MatchStatus,
    ReconciliationSummary
} from './types';
import { UI_TEXT_RECONCILIATION, ACCEPTED_BANK_STATEMENT_TYPES, ACCEPTED_INTERNAL_RECORD_TYPES, MAX_FILES_PER_UPLOAD_SLOT, MATCHING_TOLERANCE_DAYS, MATCHING_TOLERANCE_AMOUNT, MIN_REFERENCE_MATCH_LENGTH } from './constants';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Spinner } from './components/Spinner';
import { Alert, AlertType } from './components/Alert';
import { FileUploadStage } from './components/FileUploadStage';
import { ExtractedDataViewerModal } from './components/ExtractedDataViewerModal';
import { ReconciliationWorkspace } from './components/ReconciliationWorkspace';
// Placeholder for future components:
// import { ReconciliationHistoryScreen } from './components/ReconciliationHistoryScreen';

import { extractFinancialTransactions, getSampleExtractedData } from './services/geminiService';
import { generateReconciliationReportPdf } from './services/pdfService';

const LOCAL_STORAGE_RECONCILIATION_HISTORY_KEY = 'bankSyncAppHistory';
const USE_SAMPLE_DATA = false; // Set to true to use sample data instead of calling Gemini

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.FILE_UPLOAD);
  const [bankStatementFiles, setBankStatementFiles] = useState<ReconciliationFile[]>([]);
  const [internalLedgerFiles, setInternalLedgerFiles] = useState<ReconciliationFile[]>([]);
  const [currentReconciliationSession, setCurrentReconciliationSession] = useState<ReconciliationSessionData | null>(null);
  const [history, setHistory] = useState<ReconciliationSessionData[]>([]);
  const [alertMessage, setAlert] = useState<{ message: string, type: AlertType } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(UI_TEXT_RECONCILIATION.loadingMessage as string);

  const [showExtractedDataModal, setShowExtractedDataModal] = useState<boolean>(false);
  const [viewingFile, setViewingFile] = useState<ReconciliationFile | null>(null);

  const bankFilesRef = useRef(bankStatementFiles);
  useEffect(() => { bankFilesRef.current = bankStatementFiles; }, [bankStatementFiles]);
  
  const internalFilesRef = useRef(internalLedgerFiles);
  useEffect(() => { internalFilesRef.current = internalLedgerFiles; }, [internalLedgerFiles]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_RECONCILIATION_HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Error loading reconciliation history:", error);
      setAlert({ message: "Erro ao carregar histórico de conciliações.", type: AlertType.Error });
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) { // Only save if there's actual history to prevent overwriting with empty on init
        try {
            localStorage.setItem(LOCAL_STORAGE_RECONCILIATION_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Error saving reconciliation history:", error);
            setAlert({ message: "Erro ao salvar histórico de conciliações.", type: AlertType.Error });
        }
    }
  }, [history]);

  useEffect(() => {
    return () => {
      bankFilesRef.current.forEach(doc => {
        if (doc.imagePreviewUrl) URL.revokeObjectURL(doc.imagePreviewUrl);
      });
      internalFilesRef.current.forEach(doc => {
        if (doc.imagePreviewUrl) URL.revokeObjectURL(doc.imagePreviewUrl);
      });
    };
  }, []);

  const createPreviewUrl = (file: File): string | undefined => {
    if (file.type.startsWith("image/")) {
        return URL.createObjectURL(file);
    }
    return undefined; 
  };

  const handleAddFiles = (files: File[], type: ReconciliationFileType) => {
    const newReconciliationFiles: ReconciliationFile[] = files.map(file => ({
      id: `${type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}-${Math.random().toString(36).substring(2,7)}`,
      fileName: file.name,
      file: file,
      fileType: type,
      status: 'pending',
      extractedData: null,
      imagePreviewUrl: createPreviewUrl(file)
    }));

    if (type === ReconciliationFileType.BankStatement) {
      setBankStatementFiles(prev => [...prev, ...newReconciliationFiles].slice(0, MAX_FILES_PER_UPLOAD_SLOT * 5));
    } else {
      setInternalLedgerFiles(prev => [...prev, ...newReconciliationFiles].slice(0, MAX_FILES_PER_UPLOAD_SLOT * 5));
    }
    setAlert(null);
  };

  const handleRemoveFile = (fileId: string, type: ReconciliationFileType) => {
    const updateFn = type === ReconciliationFileType.BankStatement ? setBankStatementFiles : setInternalLedgerFiles;
    updateFn(prev => prev.filter(f => {
      if (f.id === fileId && f.imagePreviewUrl) {
        URL.revokeObjectURL(f.imagePreviewUrl);
      }
      return f.id !== fileId;
    }));
  };

  const fileToGenerativePart = async (file: File): Promise<{mimeType: string, data: string} | null> => {
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            mimeType: file.type,
            data: await base64EncodedDataPromise,
        };
    }
    return null;
  };
  
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
  };

  const processSingleFile = async (fileEntry: ReconciliationFile): Promise<ReconciliationFile> => {
    let updatedFileEntry = { ...fileEntry, status: 'processing' as const };
    
    const updateStateForFile = (prev: ReconciliationFile[]) => prev.map(f => f.id === fileEntry.id ? updatedFileEntry : f);
    if (fileEntry.fileType === ReconciliationFileType.BankStatement) {
        setBankStatementFiles(updateStateForFile);
    } else {
        setInternalLedgerFiles(updateStateForFile);
    }

    try {
      let extractedData: ExtractedFinancialData;
      if (USE_SAMPLE_DATA) {
          extractedData = getSampleExtractedData(fileEntry.fileType, fileEntry.id);
          await new Promise(resolve => setTimeout(resolve, 500)); 
      } else {
          let textContent: string | undefined = undefined;
          let imagePart: {mimeType: string, data: string} | null = null;

          if (fileEntry.file.type === "text/csv" || fileEntry.file.name.endsWith(".txt") || fileEntry.file.name.endsWith(".ofx") || fileEntry.file.type === "application/vnd.ms-excel" || fileEntry.file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ) {
              textContent = await readFileAsText(fileEntry.file);
          } else { 
              imagePart = await fileToGenerativePart(fileEntry.file);
          }
          
          if (!textContent && !imagePart) {
              throw new Error(`Não foi possível processar o arquivo ${fileEntry.fileName} como texto ou imagem.`);
          }

          extractedData = await extractFinancialTransactions(
              fileEntry.fileType,
              textContent,
              imagePart?.data,
              imagePart?.mimeType
          );
      }

      if (extractedData.bankTransactions) {
        extractedData.bankTransactions.forEach(t => t.sourceDocumentId = fileEntry.id);
      }
      if (extractedData.ledgerEntries) {
        extractedData.ledgerEntries.forEach(e => e.sourceDocumentId = fileEntry.id);
      }

      return { ...updatedFileEntry, status: 'success', extractedData, errorMessage: null, processedTimestamp: new Date().toISOString() };
    } catch (error) {
      console.error(`Error processing ${fileEntry.fileName}:`, error);
      return { ...updatedFileEntry, status: 'error', extractedData: null, errorMessage: (error as Error).message || UI_TEXT_RECONCILIATION.errorGeneral as string };
    }
  };

  const parseDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // DD/MM/AAAA
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const calculateDateDifferenceDays = (date1Str: string | null, date2Str: string | null): number | null => {
    const date1 = parseDate(date1Str);
    const date2 = parseDate(date2Str);
    if (date1 && date2) {
      const diffTime = Math.abs(date2.getTime() - date1.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
  };

  const performInitialMatching = (
    processedBankFiles: ReconciliationFile[],
    processedInternalFiles: ReconciliationFile[]
  ): ReconciliationSessionData => {
    setLoadingMessage(UI_TEXT_RECONCILIATION.performingInitialMatchingMessage as string);
    setIsLoading(true);

    const buildDiscrepancy = (bt: BankTransaction, le: LedgerEntry): MatchDiscrepancy | null => {
        let disc: MatchDiscrepancy = {};
        let hasDiscrepancy = false;

        // Amount
        if (bt.amount !== null && le.amount !== null && Math.abs(bt.amount - le.amount) > MATCHING_TOLERANCE_AMOUNT) {
            disc.amount = { bank: bt.amount, ledger: le.amount, difference: bt.amount - le.amount };
            hasDiscrepancy = true;
        }
        // Date
        const dateDiffDays = calculateDateDifferenceDays(bt.date, le.date);
        if (dateDiffDays !== null && dateDiffDays > MATCHING_TOLERANCE_DAYS) {
            disc.date = { bank: bt.date, ledger: le.date, differenceDaysAbs: dateDiffDays };
            hasDiscrepancy = true;
        }
        // Reference (simple check for presence and difference if both exist)
        const btRef = bt.reference?.trim().toLowerCase();
        const leRef = le.reference?.trim().toLowerCase();
        if ((btRef && !leRef) || (!btRef && leRef) || (btRef && leRef && btRef !== leRef)) {
            if (!(btRef && leRef && btRef === leRef && btRef.length >= MIN_REFERENCE_MATCH_LENGTH)) { // Don't flag if strong ref match was already primary key
                 // Only consider it a discrepancy if they *don't* match, or one is missing and the other isn't.
                // Avoid flagging as ref discrepancy if amounts and dates are exact.
                if (disc.amount || disc.date) { // Only flag ref if other things are also off or it's the only clue
                    disc.reference = true;
                    hasDiscrepancy = true;
                }
            }
        }
        // Description (very basic, could be improved with NLP/fuzzy matching)
        // For now, this is a placeholder
        // if (bt.description.toLowerCase() !== le.description.toLowerCase()) {
        //   disc.description = true;
        //   hasDiscrepancy = true;
        // }
        return hasDiscrepancy ? disc : null;
    };
    
    const allBankTransactions: BankTransaction[] = processedBankFiles
      .filter(f => f.status === 'success' && f.extractedData?.bankTransactions)
      .flatMap(f => f.extractedData!.bankTransactions!.map(bt => ({ ...bt, isMatched: false })));

    const allLedgerEntries: LedgerEntry[] = processedInternalFiles
      .filter(f => f.status === 'success' && f.extractedData?.ledgerEntries)
      .flatMap(f => f.extractedData!.ledgerEntries!.map(le => ({ ...le, isMatched: false })));
    
    const matchedPairs: MatchedPair[] = [];
    
    // Pass 1: Reference match (if available and strong) + Amount + Date
    allBankTransactions.forEach(bt => {
        if (bt.isMatched) return;
        if (bt.reference && bt.reference.trim().length >= MIN_REFERENCE_MATCH_LENGTH) {
            const potentialLedgerMatchByRef = allLedgerEntries.find(le => 
                !le.isMatched &&
                le.reference && 
                le.reference.trim().toLowerCase() === bt.reference!.trim().toLowerCase() &&
                Math.abs((bt.amount || 0) - (le.amount || 0)) <= MATCHING_TOLERANCE_AMOUNT &&
                (calculateDateDifferenceDays(bt.date, le.date) ?? (MATCHING_TOLERANCE_DAYS + 1)) <= MATCHING_TOLERANCE_DAYS
            );

            if (potentialLedgerMatchByRef) {
                bt.isMatched = true;
                potentialLedgerMatchByRef.isMatched = true;
                const discrepancy = buildDiscrepancy(bt, potentialLedgerMatchByRef);
                matchedPairs.push({
                    id: `match-${bt.id}-${potentialLedgerMatchByRef.id}`,
                    bankTransaction: bt,
                    ledgerEntry: potentialLedgerMatchByRef,
                    matchConfidence: 'high',
                    discrepancy: discrepancy,
                    status: discrepancy ? MatchStatus.MatchedWithDiscrepancy : MatchStatus.MatchedExact,
                });
            }
        }
    });


    // Pass 2: Amount + Date (more tolerant, might create more discrepancies)
    allBankTransactions.forEach(bt => {
      if (bt.isMatched) return; // Skip already matched

      const potentialLedgerMatches = allLedgerEntries.filter(le =>
        !le.isMatched &&
        bt.amount !== null && le.amount !== null &&
        Math.abs(bt.amount - le.amount) <= MATCHING_TOLERANCE_AMOUNT &&
        (calculateDateDifferenceDays(bt.date, le.date) ?? (MATCHING_TOLERANCE_DAYS + 1)) <= MATCHING_TOLERANCE_DAYS
      );
      
      // Simplistic: take the first one for now. Real scenario might need scoring or manual choice.
      if (potentialLedgerMatches.length > 0) {
        const le = potentialLedgerMatches[0]; // Could be refined
        bt.isMatched = true;
        le.isMatched = true;
        const discrepancy = buildDiscrepancy(bt, le);
        matchedPairs.push({
          id: `match-${bt.id}-${le.id}`,
          bankTransaction: bt,
          ledgerEntry: le,
          matchConfidence: 'medium', // Could be 'low' if references are very different
          discrepancy: discrepancy,
          status: discrepancy ? MatchStatus.MatchedWithDiscrepancy : MatchStatus.MatchedExact,
        });
      }
    });

    // Calculate Summary
    const summary: ReconciliationSummary = {
      totalBankTransactions: allBankTransactions.length,
      totalLedgerEntries: allLedgerEntries.length,
      totalBankAmount: allBankTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      totalLedgerAmount: allLedgerEntries.reduce((sum, e) => sum + (e.amount || 0), 0),
      matchedPairsCount: matchedPairs.length,
      totalAmountMatched: matchedPairs
        .filter(p => p.status === MatchStatus.MatchedExact)
        .reduce((sum, p) => sum + (p.bankTransaction.amount || 0), 0),
      discrepanciesCount: matchedPairs.filter(p => p.status === MatchStatus.MatchedWithDiscrepancy).length,
      totalAmountBankInDiscrepancies: matchedPairs
        .filter(p => p.status === MatchStatus.MatchedWithDiscrepancy)
        .reduce((sum, p) => sum + (p.bankTransaction.amount || 0), 0),
      totalAmountLedgerInDiscrepancies: matchedPairs
        .filter(p => p.status === MatchStatus.MatchedWithDiscrepancy)
        .reduce((sum, p) => sum + (p.ledgerEntry.amount || 0), 0),
      netDifferenceInDiscrepancies: 0, // Calculated below
      unmatchedBankItemsCount: allBankTransactions.filter(t => !t.isMatched).length,
      totalUnmatchedBankValue: allBankTransactions.filter(t => !t.isMatched).reduce((sum, t) => sum + (t.amount || 0), 0),
      unmatchedLedgerItemsCount: allLedgerEntries.filter(e => !e.isMatched).length,
      totalUnmatchedLedgerValue: allLedgerEntries.filter(e => !e.isMatched).reduce((sum, e) => sum + (e.amount || 0), 0),
    };
    summary.netDifferenceInDiscrepancies = summary.totalAmountBankInDiscrepancies - summary.totalAmountLedgerInDiscrepancies;


    const session: ReconciliationSessionData = {
      sessionId: `session-${Date.now()}`,
      sessionDate: new Date().toISOString(),
      bankStatementFiles: processedBankFiles,
      internalLedgerFiles: processedInternalFiles,
      allBankTransactions,
      allLedgerEntries,
      matchedPairs,
      summary,
      generationTimestamp: new Date().toISOString(),
    };
    
    setIsLoading(false);
    return session;
  };


  const handleProcessAllFiles = useCallback(async () => {
    const allFiles = [...bankStatementFiles, ...internalLedgerFiles];
    const pendingFiles = allFiles.filter(f => f.status === 'pending');

    if (pendingFiles.length === 0) {
      const successfullyProcessed = allFiles.filter(f => f.status === 'success');
      if (successfullyProcessed.length > 0 && (bankStatementFiles.some(f=>f.status === 'success') || internalLedgerFiles.some(f=>f.status === 'success'))) {
        setAlert({ message: UI_TEXT_RECONCILIATION.allFilesProcessedOrError as string + " Iniciando conciliação...", type: AlertType.Info });
        const sessionData = performInitialMatching(bankStatementFiles, internalLedgerFiles);
        setCurrentReconciliationSession(sessionData);
        setAppState(AppState.VIEWING_RECONCILIATION);
      } else {
        setAlert({ message: UI_TEXT_RECONCILIATION.allFilesProcessedOrError as string, type: AlertType.Info });
      }
      return;
    }

    setAppState(AppState.PROCESSING_FILES); // Keep this to visually separate from upload stage
    setIsLoading(true);
    setLoadingMessage(UI_TEXT_RECONCILIATION.processingFilesMessage as string);
    setAlert(null);

    const processingPromises = pendingFiles.map(fileToProcess => processSingleFile(fileToProcess));
    const results = await Promise.all(processingPromises);

    let finalBankFiles = [...bankStatementFiles];
    let finalInternalFiles = [...internalLedgerFiles];

    results.forEach(processedFile => {
        if (processedFile.fileType === ReconciliationFileType.BankStatement) {
            finalBankFiles = finalBankFiles.map(f => f.id === processedFile.id ? processedFile : f);
        } else {
            finalInternalFiles = finalInternalFiles.map(f => f.id === processedFile.id ? processedFile : f);
        }
    });
    
    setBankStatementFiles(finalBankFiles);
    setInternalLedgerFiles(finalInternalFiles);
    // setIsLoading(false); // Moved to performInitialMatching

    const anySuccess = results.some(r => r.status === 'success');
    const anyError = results.some(r => r.status === 'error');

    if (anySuccess) {
      setAlert({ message: "Extração de dados concluída. Realizando conciliação automática...", type: AlertType.Success });
      const sessionData = performInitialMatching(finalBankFiles, finalInternalFiles);
      setCurrentReconciliationSession(sessionData);
      setAppState(AppState.VIEWING_RECONCILIATION);
    } else if (anyError && !anySuccess) {
      setAlert({ message: "Todos os arquivos pendentes falharam ao processar.", type: AlertType.Error });
      setIsLoading(false);
      setAppState(AppState.FILE_UPLOAD);
    } else { // No pending files were processed (e.g., all were already processed)
      setAlert({ message: "Nenhum arquivo novo para processar.", type: AlertType.Info });
      setIsLoading(false);
      setAppState(AppState.FILE_UPLOAD); // Or VIEWING_RECONCILIATION if there's existing data
      if (currentReconciliationSession) {
        setAppState(AppState.VIEWING_RECONCILIATION);
      }
    }
  }, [bankStatementFiles, internalLedgerFiles, currentReconciliationSession]);

  const handleStartNewReconciliation = () => {
    setBankStatementFiles([]);
    setInternalLedgerFiles([]);
    setCurrentReconciliationSession(null);
    setAlert(null);
    setAppState(AppState.FILE_UPLOAD);
  };
  
  const handleDownloadReport = async () => {
    if (currentReconciliationSession) {
      setIsLoading(true);
      setLoadingMessage(UI_TEXT_RECONCILIATION.reportDownloadInProgress as string);
      setAlert(null);
      try {
        await generateReconciliationReportPdf(currentReconciliationSession);
        setAlert({ message: UI_TEXT_RECONCILIATION.reportDownloadSuccess as string, type: AlertType.Success });
      } catch (err) {
        console.error("Error generating PDF report:", err);
        setAlert({ message: `Erro ao gerar relatório: ${(err as Error).message}`, type: AlertType.Error });
      } finally {
        setIsLoading(false);
      }
    } else {
        setAlert({ message: "Nenhuma sessão de conciliação ativa para gerar relatório.", type: AlertType.Warning });
    }
  };


  const handleViewExtractedData = (file: ReconciliationFile) => {
    setViewingFile(file);
    setShowExtractedDataModal(true);
  };

  const renderContent = () => {
    if (isLoading) {
        return <Spinner text={loadingMessage} />;
    }
    switch (appState) {
      case AppState.FILE_UPLOAD:
      case AppState.PROCESSING_FILES: // Covered by isLoading or transitions quickly
        return (
          <FileUploadStage
            bankStatementFiles={bankStatementFiles}
            internalLedgerFiles={internalLedgerFiles}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onProcessAllFiles={handleProcessAllFiles}
            onViewExtractedData={handleViewExtractedData}
            canProceedToReconciliation={!!currentReconciliationSession}
            onProceedToReconciliation={() => setAppState(AppState.VIEWING_RECONCILIATION)}
          />
        );
      
      case AppState.VIEWING_RECONCILIATION:
        if (!currentReconciliationSession) {
            // This case should ideally not be hit if logic is correct, but as a fallback:
            setAlert({ message: "Nenhuma sessão de conciliação ativa. Por favor, processe os arquivos primeiro.", type: AlertType.Warning });
            setAppState(AppState.FILE_UPLOAD);
            return <Spinner text="Redirecionando..." />;
        }
        return (
            <ReconciliationWorkspace 
                sessionData={currentReconciliationSession}
                allFiles={[...bankStatementFiles, ...internalLedgerFiles]}
                onStartNewReconciliation={handleStartNewReconciliation}
                onDownloadReport={handleDownloadReport}
            />
        );

      case AppState.VIEW_SESSION_HISTORY:
        return (
            <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-xl text-center">
                 <h2 className="text-2xl font-bold text-sky-700 mb-6">{UI_TEXT_RECONCILIATION.reconciliationHistoryTitle as string}</h2>
                 <p className="text-slate-500 mb-6">(Funcionalidade de Histórico em desenvolvimento)</p>
                 <button
                    onClick={handleStartNewReconciliation}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150 ease-in-out"
                 >
                    {UI_TEXT_RECONCILIATION.backToFileUploadButton as string}
                 </button>
            </div>
        );
      default:
        return <Alert message="Estado da aplicação desconhecido." type={AlertType.Error} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-700">
      <Header title={UI_TEXT_RECONCILIATION.appName as string} />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8 w-full">
        {alertMessage && <Alert message={alertMessage.message} type={alertMessage.type} onDismiss={() => setAlert(null)} />}
        <div className="mt-4">
          {renderContent()}
        </div>
      </main>
      <Footer />

      {showExtractedDataModal && viewingFile && (
        <ExtractedDataViewerModal
          isOpen={showExtractedDataModal}
          onClose={() => { setShowExtractedDataModal(false); setViewingFile(null); }}
          file={viewingFile}
        />
      )}
    </div>
  );
};

export default App;