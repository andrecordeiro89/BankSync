
import React from 'react';
import { MatchedPair, MatchDiscrepancy, MatchStatus } from '../types';
import { UI_TEXT_RECONCILIATION as UI_TEXT } from '../constants';

interface MatchedItemCardProps {
  pair: MatchedPair;
}

const DiscrepancyDetail: React.FC<{ label: string, detail: string | React.ReactNode, icon?: React.ReactNode }> = ({ label, detail, icon }) => (
  <div className="flex items-start text-xs text-amber-700">
    {icon || (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 mr-1 mt-0.5 flex-shrink-0 text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    )}
    <strong>{label}:&nbsp;</strong>
    <span>{detail}</span>
  </div>
);

export const MatchedItemCard: React.FC<MatchedItemCardProps> = ({ pair }) => {
  const { bankTransaction, ledgerEntry, discrepancy, status } = pair;

  const cardBorderColor = status === MatchStatus.MatchedExact ? 'border-emerald-500' : 'border-amber-500';
  const cardBgColor = status === MatchStatus.MatchedExact ? 'bg-emerald-50' : 'bg-amber-50';
  const headerTextColor = status === MatchStatus.MatchedExact ? 'text-emerald-700' : 'text-amber-700';
  const headerText = status === MatchStatus.MatchedExact ? UI_TEXT.exactMatchInfo : UI_TEXT.discrepancyInfo;


  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined') return 'N/A';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className={`p-3 sm:p-4 rounded-lg shadow-sm border-l-4 ${cardBorderColor} ${cardBgColor} transition-all duration-150 hover:shadow-md`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className={`text-sm font-semibold ${headerTextColor}`}>{headerText as string}</h4>
        {/* Add actions here later e.g., unmatch, investigate */}
      </div>

      <div className="grid md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
        {/* Bank Transaction Details */}
        <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-xs">
          <p className="font-semibold text-sky-700 mb-1 pb-1 border-b border-slate-200">Transação Bancária</p>
          <p><strong>Data:</strong> {bankTransaction.date || 'N/A'}</p>
          <p className="truncate" title={bankTransaction.description}><strong>Desc:</strong> {bankTransaction.description}</p>
          <p><strong>Valor:</strong> <span className={bankTransaction.amount && bankTransaction.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(bankTransaction.amount)}</span></p>
          {bankTransaction.reference && <p className="truncate" title={bankTransaction.reference}><strong>Ref:</strong> {bankTransaction.reference}</p>}
        </div>

        {/* Ledger Entry Details */}
        <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-xs">
          <p className="font-semibold text-teal-700 mb-1 pb-1 border-b border-slate-200">Lançamento Interno</p>
          <p><strong>Data:</strong> {ledgerEntry.date || 'N/A'}</p>
          <p className="truncate" title={ledgerEntry.description}><strong>Desc:</strong> {ledgerEntry.description}</p>
          <p><strong>Valor:</strong> <span className="text-blue-600">{formatCurrency(ledgerEntry.amount)}</span></p>
          {ledgerEntry.reference && <p className="truncate" title={ledgerEntry.reference}><strong>Ref:</strong> {ledgerEntry.reference}</p>}
          {ledgerEntry.accountCode && <p><strong>Conta:</strong> {ledgerEntry.accountCode}</p>}
        </div>
      </div>

      {discrepancy && (
        <div className="mt-3 pt-2 border-t border-amber-300 space-y-1">
          {discrepancy.amount && (
            <DiscrepancyDetail 
              label="Valor" 
              detail={(UI_TEXT.amountMismatchAlert as (b:string, l:string, d:string)=>string)(formatCurrency(discrepancy.amount.bank), formatCurrency(discrepancy.amount.ledger), formatCurrency(discrepancy.amount.difference))}
            />
          )}
          {discrepancy.date && (
            <DiscrepancyDetail 
              label="Data" 
              detail={(UI_TEXT.dateMismatchAlert as (bd:string, ld:string, dd:number)=>string)(discrepancy.date.bank || 'N/A', discrepancy.date.ledger || 'N/A', discrepancy.date.differenceDaysAbs)}
            />
          )}
          {discrepancy.reference && (
            <DiscrepancyDetail label="Referência" detail={UI_TEXT.referenceMismatchAlert as string} />
          )}
           {discrepancy.description && (
            <DiscrepancyDetail label="Descrição" detail={UI_TEXT.descriptionMismatchAlert as string} />
          )}
        </div>
      )}
    </div>
  );
};
