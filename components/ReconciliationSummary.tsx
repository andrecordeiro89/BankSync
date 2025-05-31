
import React from 'react';
import { ReconciliationSummary as SummaryType } from '../types';
import { UI_TEXT_RECONCILIATION as UI_TEXT } from '../constants';

interface ReconciliationSummaryProps {
  summary: SummaryType;
}

const SummaryItem: React.FC<{ label: string, value: string | number, valueColor?: string, isCurrency?: boolean, extraInfo?: string }> = ({ label, value, valueColor = "text-slate-800", isCurrency = false, extraInfo }) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return isCurrency ? val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : val.toLocaleString('pt-BR');
    }
    return val;
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow border border-slate-200 hover:shadow-md transition-shadow duration-150">
      <dt className="text-xs sm:text-sm font-medium text-slate-500 truncate">{label}</dt>
      <dd className={`mt-1 text-xl sm:text-2xl font-bold ${valueColor}`}>{formatValue(value)}</dd>
      {extraInfo && <p className="text-xs text-slate-400 mt-0.5">{extraInfo}</p>}
    </div>
  );
};

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({ summary }) => {
  return (
    <section aria-labelledby="reconciliation-summary-title" className="my-6 sm:my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 id="reconciliation-summary-title" className="text-xl sm:text-2xl font-semibold text-sky-700">
          {UI_TEXT.reconciliationSummaryTitle as string}
        </h2>
        {/* Potential placeholder for a refresh summary button or last updated time */}
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryItem label={UI_TEXT.summaryTotalBankItems as string} value={summary.totalBankTransactions} />
        <SummaryItem label={UI_TEXT.summaryTotalLedgerItems as string} value={summary.totalLedgerEntries} />
        <SummaryItem label={UI_TEXT.summaryTotalBankAmount as string} value={summary.totalBankAmount} isCurrency valueColor={summary.totalBankAmount >= 0 ? "text-emerald-600" : "text-rose-600"} />
        <SummaryItem label={UI_TEXT.summaryTotalLedgerAmount as string} value={summary.totalLedgerAmount} isCurrency valueColor="text-sky-600" />

        <SummaryItem label={UI_TEXT.summaryMatchedPairsCount as string} value={summary.matchedPairsCount} valueColor="text-emerald-600" />
        <SummaryItem label={UI_TEXT.summaryTotalAmountMatched as string} value={summary.totalAmountMatched} isCurrency valueColor="text-emerald-600" />
        
        <SummaryItem label={UI_TEXT.summaryDiscrepanciesCount as string} value={summary.discrepanciesCount} valueColor={summary.discrepanciesCount > 0 ? "text-amber-600" : "text-slate-800"} />
        <SummaryItem 
            label={UI_TEXT.summaryNetDifferenceInDiscrepancies as string} 
            value={summary.netDifferenceInDiscrepancies} 
            isCurrency 
            valueColor={summary.netDifferenceInDiscrepancies !== 0 ? "text-amber-700 font-bold" : "text-slate-800"}
            extraInfo={`Banco: ${summary.totalAmountBankInDiscrepancies.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, Interno: ${summary.totalAmountLedgerInDiscrepancies.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
        />

        <SummaryItem label={UI_TEXT.summaryUnmatchedBankCount as string} value={summary.unmatchedBankItemsCount} valueColor={summary.unmatchedBankItemsCount > 0 ? "text-rose-600" : "text-slate-800"} />
        <SummaryItem label={UI_TEXT.summaryUnmatchedBankValue as string} value={summary.totalUnmatchedBankValue} isCurrency valueColor={summary.unmatchedBankItemsCount > 0 ? "text-rose-600" : "text-slate-800"} />
        <SummaryItem label={UI_TEXT.summaryUnmatchedLedgerCount as string} value={summary.unmatchedLedgerItemsCount} valueColor={summary.unmatchedLedgerItemsCount > 0 ? "text-rose-600" : "text-slate-800"}/>
        <SummaryItem label={UI_TEXT.summaryUnmatchedLedgerValue as string} value={summary.totalUnmatchedLedgerValue} isCurrency valueColor={summary.unmatchedLedgerItemsCount > 0 ? "text-rose-600" : "text-slate-800"}/>
      </dl>
    </section>
  );
};
