
import React from 'react';
import { BankTransaction, LedgerEntry, ItemType } from '../types';

interface UnmatchedItemCardProps {
  item: BankTransaction | LedgerEntry;
  type: ItemType;
  // onSelectItem?: (itemId: string, itemType: ItemType) => void; // For manual matching later
  // isSelected?: boolean; // For manual matching later
}

export const UnmatchedItemCard: React.FC<UnmatchedItemCardProps> = ({ item, type /*, onSelectItem, isSelected */ }) => {
  const isBank = type === ItemType.BankTransaction;
  const tx = item as BankTransaction; // Cast for bank-specific fields
  const entry = item as LedgerEntry; // Cast for ledger-specific fields

  const cardBgColor = 'bg-white';
  const headerColor = isBank ? 'text-sky-700' : 'text-teal-700';
  const headerText = isBank ? 'Transação Bancária Não Conciliada' : 'Lançamento Interno Não Conciliado';

  // const cardClasses = `p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 ${cardBgColor} ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'} transition-all duration-150 cursor-pointer`;
  const cardClasses = `p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 ${cardBgColor} hover:shadow-md transition-all duration-150`;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined') return 'N/A';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div 
      className={cardClasses}
      // onClick={() => onSelectItem && onSelectItem(item.id, type)}
      // role="button"
      // tabIndex={0}
      // aria-pressed={isSelected}
    >
      <h5 className={`text-sm font-semibold ${headerColor} mb-2 pb-1 border-b border-slate-200`}>{headerText}</h5>
      <div className="space-y-1 text-xs sm:text-sm text-slate-700">
        <p><strong>Data:</strong> {item.date || 'N/A'}</p>
        <p className="truncate" title={item.description}><strong>Desc:</strong> {item.description}</p>
        {isBank ? (
          <p><strong>Valor:</strong> <span className={tx.amount && tx.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}>{formatCurrency(tx.amount)}</span></p>
        ) : (
          <p><strong>Valor:</strong> <span className="text-blue-600">{formatCurrency(entry.amount)}</span></p>
        )}
        {item.reference && <p className="truncate" title={item.reference}><strong>Ref:</strong> {item.reference}</p>}
        {isBank && tx.balanceAfter !== null && typeof tx.balanceAfter !== 'undefined' && <p><strong>Saldo Pós:</strong> {formatCurrency(tx.balanceAfter)}</p>}
        {!isBank && entry.accountCode && <p><strong>Conta:</strong> {entry.accountCode}</p>}
        {!isBank && entry.costCenter && <p><strong>C. Custo:</strong> {entry.costCenter}</p>}
      </div>
       {/* Placeholder for future actions like "Mark for Investigation" or "Create New Ledger Entry" */}
    </div>
  );
};
