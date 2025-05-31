
import React from 'react';
import { ReconciliationFile, BankTransaction, LedgerEntry } from '../types';
import { UI_TEXT_RECONCILIATION as UI_TEXT } from '../constants';
import { Modal } from './Modal';
import { Alert, AlertType } from './Alert';

interface ExtractedDataViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ReconciliationFile | null;
}

const TransactionTable: React.FC<{ transactions: BankTransaction[] | LedgerEntry[], type: 'bank' | 'ledger' }> = ({ transactions, type }) => {
  if (!transactions || transactions.length === 0) {
    return <p className="text-sm text-slate-500 italic py-2">Nenhum dado para exibir.</p>;
  }

  const isBankTx = (tx: any): tx is BankTransaction => type === 'bank';

  return (
    <div className="overflow-x-auto max-h-[55vh] border border-slate-200 rounded-md">
      <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
        <thead className="bg-slate-100 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Data</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Descrição</th>
            <th className="px-3 py-2 text-right font-semibold text-slate-600">Valor</th>
            <th className="px-3 py-2 text-left font-semibold text-slate-600">Referência</th>
            {type === 'bank' && <th className="px-3 py-2 text-right font-semibold text-slate-600">Saldo Pós</th>}
            {type === 'ledger' && <th className="px-3 py-2 text-left font-semibold text-slate-600">Conta</th>}
            {type === 'ledger' && <th className="px-3 py-2 text-left font-semibold text-slate-600">C. Custo</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-3 py-2 whitespace-nowrap">{tx.date || 'N/A'}</td>
              <td className="px-3 py-2 max-w-xs truncate" title={tx.description}>{tx.description}</td>
              <td className={`px-3 py-2 whitespace-nowrap text-right font-medium ${isBankTx(tx) && tx.amount && tx.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {tx.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={tx.reference || undefined}>{tx.reference || 'N/A'}</td>
              {isBankTx(tx) && (
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  {(tx as BankTransaction).balanceAfter?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}
                </td>
              )}
              {!isBankTx(tx) && (
                <>
                  <td className="px-3 py-2 whitespace-nowrap">{(tx as LedgerEntry).accountCode || 'N/A'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{(tx as LedgerEntry).costCenter || 'N/A'}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export const ExtractedDataViewerModal: React.FC<ExtractedDataViewerModalProps> = ({ isOpen, onClose, file }) => {
  if (!isOpen || !file) return null;

  const { extractedData, fileName, status, errorMessage } = file;
  const bankTransactions = extractedData?.bankTransactions || [];
  const ledgerEntries = extractedData?.ledgerEntries || [];
  const parseErrors = extractedData?.parseErrors || [];

  const closeButtonClass = "bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={(UI_TEXT.modalTitleViewExtractedData as (fileName: string) => string)(fileName)}
      size="5xl"
    >
      <div className="space-y-4">
        {status === 'error' && errorMessage && (
          <Alert message={`Erro no processamento: ${errorMessage}`} type={AlertType.Error} />
        )}
        {parseErrors.length > 0 && (
          <Alert message="A IA encontrou os seguintes problemas ao analisar o arquivo:" type={AlertType.Warning}>
            <ul className="list-disc list-inside mt-1 text-xs">
              {parseErrors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </Alert>
        )}

        {bankTransactions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-sky-700 mb-2">{UI_TEXT.bankTransactionsTitle as string}</h3>
            <TransactionTable transactions={bankTransactions} type="bank" />
          </div>
        )}

        {ledgerEntries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-teal-700 mb-2">{UI_TEXT.ledgerEntriesTitle as string}</h3>
            <TransactionTable transactions={ledgerEntries} type="ledger" />
          </div>
        )}

        {(bankTransactions.length === 0 && ledgerEntries.length === 0 && parseErrors.length === 0 && status !== 'error') && (
          <p className="text-slate-500 italic">Nenhum dado financeiro foi extraído deste arquivo.</p>
        )}

        <div className="mt-6 flex justify-end pt-4 border-t border-slate-200">
          <button onClick={onClose} className={closeButtonClass}>
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
