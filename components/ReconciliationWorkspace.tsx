

import React, { useState } from 'react';
import { ReconciliationSessionData, ReconciliationFile, MatchedPair, BankTransaction, LedgerEntry, ItemType, MatchStatus } from '../types';
import { UI_TEXT_RECONCILIATION as UI_TEXT } from '../constants';
// import { ReconciliationSummary } from './ReconciliationSummary'; // Removed import
import { MatchedItemCard } from './MatchedItemCard';
import { UnmatchedItemCard } from './UnmatchedItemCard';

interface ReconciliationWorkspaceProps {
  sessionData: ReconciliationSessionData;
  allFiles: ReconciliationFile[]; // To potentially link back to source files
  onStartNewReconciliation: () => void;
  onDownloadReport: () => void;
  // Add handlers for manual matching, etc. in the future
}

export const ReconciliationWorkspace: React.FC<ReconciliationWorkspaceProps> = ({
  sessionData,
  // allFiles, // Currently unused, but good for future reference
  onStartNewReconciliation,
  onDownloadReport,
}) => {
  const { matchedPairs, allBankTransactions, allLedgerEntries } = sessionData;

  const [activeTab, setActiveTab] = useState<'matched' | 'unmatched_bank' | 'unmatched_ledger'>('matched');

  const unmatchedBankTransactions = allBankTransactions.filter(bt => !bt.isMatched);
  const unmatchedLedgerEntries = allLedgerEntries.filter(le => !le.isMatched);

  const exactMatches = matchedPairs.filter(p => p.status === MatchStatus.MatchedExact);
  const discrepancies = matchedPairs.filter(p => p.status === MatchStatus.MatchedWithDiscrepancy);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'matched':
        return (
          <>
            {exactMatches.length > 0 && (
              <section className="mb-8">
                <h3 className="text-xl font-semibold text-emerald-700 mb-3">{UI_TEXT.matchedItemsTitle as string} ({exactMatches.length})</h3>
                <div className="space-y-3">
                  {exactMatches.map(pair => <MatchedItemCard key={pair.id} pair={pair} />)}
                </div>
              </section>
            )}
            {discrepancies.length > 0 && (
              <section className="mb-8">
                <h3 className="text-xl font-semibold text-amber-700 mb-3">{UI_TEXT.discrepanciesTitle as string} ({discrepancies.length})</h3>
                 <div className="space-y-3">
                  {discrepancies.map(pair => <MatchedItemCard key={pair.id} pair={pair} />)}
                </div>
              </section>
            )}
            {exactMatches.length === 0 && discrepancies.length === 0 && (
              <p className="text-slate-500 italic">Nenhum item conciliado ou com divergência encontrado nesta sessão.</p>
            )}
          </>
        );
      case 'unmatched_bank':
        return (
          <section>
            <h3 className="text-xl font-semibold text-sky-700 mb-3">{UI_TEXT.unmatchedBankTitle as string} ({unmatchedBankTransactions.length})</h3>
            {unmatchedBankTransactions.length > 0 ? (
              <div className="space-y-3">
                {unmatchedBankTransactions.map(tx => <UnmatchedItemCard key={tx.id} item={tx} type={ItemType.BankTransaction} />)}
              </div>
            ) : (
              <p className="text-slate-500 italic">Todas as transações bancárias foram conciliadas ou não há transações extraídas.</p>
            )}
          </section>
        );
      case 'unmatched_ledger':
        return (
          <section>
            <h3 className="text-xl font-semibold text-teal-700 mb-3">{UI_TEXT.unmatchedLedgerTitle as string} ({unmatchedLedgerEntries.length})</h3>
            {unmatchedLedgerEntries.length > 0 ? (
              <div className="space-y-3">
                {unmatchedLedgerEntries.map(entry => <UnmatchedItemCard key={entry.id} item={entry} type={ItemType.LedgerEntry} />)}
              </div>
            ) : (
              <p className="text-slate-500 italic">Todos os lançamentos internos foram conciliados ou não há lançamentos extraídos.</p>
            )}
          </section>
        );
      default:
        return null;
    }
  };
  
  const getTabClass = (tabName: 'matched' | 'unmatched_bank' | 'unmatched_ledger') => {
    return `py-2 px-4 font-medium rounded-t-lg transition-colors duration-150 focus:outline-none border-b-2 ${
      activeTab === tabName
        ? 'text-sky-600 border-sky-600 bg-sky-50'
        : 'text-slate-500 hover:text-sky-500 border-transparent hover:border-sky-300'
    }`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white p-4 sm:p-6 rounded-xl shadow-xl border border-slate-200">
      <header className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-700">
          {UI_TEXT.reconciliationWorkspaceTitle as string}
        </h2>
        <p className="text-sm text-slate-500">Sessão ID: {sessionData.sessionId}</p>
      </header>

      {/* <ReconciliationSummary summary={summary} /> // Removed ReconciliationSummary component */}

      <div className="my-8">
        <div className="border-b border-slate-300 mb-6">
          <nav className="-mb-px flex space-x-2 sm:space-x-4" aria-label="Tabs">
            <button onClick={() => setActiveTab('matched')} className={getTabClass('matched')}>
              Conciliados & Divergências ({matchedPairs.length})
            </button>
            <button onClick={() => setActiveTab('unmatched_bank')} className={getTabClass('unmatched_bank')}>
              Pendentes Extrato ({unmatchedBankTransactions.length})
            </button>
            <button onClick={() => setActiveTab('unmatched_ledger')} className={getTabClass('unmatched_ledger')}>
              Pendentes Interno ({unmatchedLedgerEntries.length})
            </button>
          </nav>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg shadow-inner min-h-[200px]">
            {renderTabContent()}
        </div>
      </div>
      
      <footer className="mt-8 pt-6 border-t border-slate-300 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onStartNewReconciliation}
          className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          {UI_TEXT.backToFileUploadButton as string}
        </button>
        <button
          onClick={onDownloadReport}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          {UI_TEXT.downloadReportButton as string}
        </button>
        {/* Add more actions like "Save Progress" or "Finalize Reconciliation" later */}
      </footer>
    </div>
  );
};